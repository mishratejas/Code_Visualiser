"""
Scrape Codeforces solutions from GitHub repositories.

This is a lightweight alternative to Project CodeNet - downloads only what you need!
"""

import requests
import os
import json
import time
import logging
from pathlib import Path
from typing import List, Dict, Optional
import re
from urllib.parse import urlparse
import base64

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CodeforcesScraper:
    """Scrape Codeforces solutions from GitHub"""
    
    def __init__(self, output_dir: str = "./data/codeforces", github_token: Optional[str] = None):
        """
        Initialize scraper
        
        Args:
            output_dir: Directory to save scraped solutions
            github_token: Optional GitHub API token for higher rate limits
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
        }
        
        if github_token:
            self.headers['Authorization'] = f'token {github_token}'
            logger.info("Using GitHub token - rate limit: 5000 requests/hour")
        else:
            logger.info("No GitHub token - rate limit: 60 requests/hour")
            logger.info("Get token at: https://github.com/settings/tokens")
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Track statistics
        self.stats = {
            'repos_processed': 0,
            'files_downloaded': 0,
            'problems_found': set(),
            'languages': {},
            'errors': 0
        }
    
    def search_repositories(self, max_repos: int = 20) -> List[Dict]:
        """
        Search for Codeforces solution repositories on GitHub
        
        Args:
            max_repos: Maximum number of repositories to find
            
        Returns:
            List of repository metadata
        """
        logger.info(f"Searching for Codeforces repositories (max: {max_repos})...")
        
        repos = []
        queries = [
            "codeforces solutions",
            "codeforces accepted",
            "codeforces cpp",
            "codeforces python",
        ]
        
        for query in queries:
            if len(repos) >= max_repos:
                break
            
            try:
                url = "https://api.github.com/search/repositories"
                params = {
                    'q': query,
                    'sort': 'stars',
                    'order': 'desc',
                    'per_page': min(30, max_repos - len(repos))
                }
                
                response = self.session.get(url, params=params)
                
                if response.status_code == 403:
                    logger.warning("GitHub API rate limit exceeded. Wait or add token.")
                    break
                
                response.raise_for_status()
                data = response.json()
                
                for repo in data.get('items', []):
                    if len(repos) >= max_repos:
                        break
                    
                    # Filter for repos that look like solution collections
                    if any(keyword in repo['full_name'].lower() for keyword in ['codeforces', 'cf', 'competitive']):
                        repos.append({
                            'full_name': repo['full_name'],
                            'description': repo.get('description', ''),
                            'stars': repo['stargazers_count'],
                            'language': repo.get('language', 'Unknown'),
                            'url': repo['html_url'],
                            'api_url': repo['url']
                        })
                        logger.info(f"  Found: {repo['full_name']} ({repo['stargazers_count']} ⭐)")
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error searching repositories: {e}")
                self.stats['errors'] += 1
        
        logger.info(f"Found {len(repos)} repositories")
        return repos
    
    def get_repo_contents(self, repo_full_name: str, path: str = "") -> List[Dict]:
        """
        Get contents of a repository directory
        
        Args:
            repo_full_name: Repository full name (owner/repo)
            path: Path within repository
            
        Returns:
            List of file/directory metadata
        """
        url = f"https://api.github.com/repos/{repo_full_name}/contents/{path}"
        
        try:
            response = self.session.get(url)
            
            if response.status_code == 403:
                logger.warning("Rate limit hit, waiting 60 seconds...")
                time.sleep(60)
                response = self.session.get(url)
            
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error(f"Error getting contents from {repo_full_name}/{path}: {e}")
            self.stats['errors'] += 1
            return []
    
    def extract_problem_id(self, filename: str, path: str) -> Optional[str]:
        """
        Extract Codeforces problem ID from filename or path
        
        Examples:
            "1234A.cpp" -> "1234A"
            "problem_1234A.py" -> "1234A"
            "1234/A.cpp" -> "1234A"
            "div2/1234A.cpp" -> "1234A"
        """
        # Try various patterns
        patterns = [
            r'(\d{3,4}[A-Z]\d?)',  # 1234A, 1234A1
            r'(\d{3,4})[_\-/]([A-Z]\d?)',  # 1234_A, 1234-A, 1234/A
            r'problem[_\-](\d{3,4}[A-Z]\d?)',  # problem_1234A
        ]
        
        combined = filename + "/" + path
        
        for pattern in patterns:
            match = re.search(pattern, combined, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    return match.group(1) + match.group(2).upper()
                else:
                    return match.group(1).upper()
        
        return None
    
    def download_file(self, repo_full_name: str, file_info: Dict, problem_id: Optional[str] = None) -> bool:
        """
        Download a single source file
        
        Args:
            repo_full_name: Repository name
            file_info: File metadata from GitHub API
            problem_id: Problem ID if known
            
        Returns:
            True if successful
        """
        try:
            filename = file_info['name']
            path = file_info['path']
            
            # Determine language
            ext = Path(filename).suffix.lower()
            lang_map = {
                '.cpp': 'cpp',
                '.cc': 'cpp',
                '.cxx': 'cpp',
                '.c': 'c',
                '.py': 'python',
                '.java': 'java',
                '.js': 'javascript',
                '.cs': 'csharp',
            }
            
            language = lang_map.get(ext)
            if not language:
                return False  # Skip unsupported languages
            
            # Extract problem ID if not provided
            if not problem_id:
                problem_id = self.extract_problem_id(filename, path)
            
            if not problem_id:
                return False  # Skip if can't determine problem
            
            # Download file content
            response = self.session.get(file_info['download_url'])
            response.raise_for_status()
            
            code = response.text
            
            # Skip empty or very large files
            if not code or len(code) > 50000:
                return False
            
            # Save file
            lang_dir = self.output_dir / language
            lang_dir.mkdir(exist_ok=True)
            
            # Create unique filename
            safe_repo_name = repo_full_name.replace('/', '_')
            output_filename = f"{problem_id}_{safe_repo_name}_{filename}"
            output_path = lang_dir / output_filename
            
            with open(output_path, 'w', encoding='utf-8', errors='ignore') as f:
                f.write(code)
            
            # Update stats
            self.stats['files_downloaded'] += 1
            self.stats['problems_found'].add(problem_id)
            self.stats['languages'][language] = self.stats['languages'].get(language, 0) + 1
            
            return True
            
        except Exception as e:
            logger.error(f"Error downloading {file_info['name']}: {e}")
            self.stats['errors'] += 1
            return False
    
    def scrape_repository(self, repo_full_name: str, max_files: int = 200) -> int:
        """
        Scrape all solution files from a repository
        
        Args:
            repo_full_name: Repository full name
            max_files: Maximum files to download from this repo
            
        Returns:
            Number of files downloaded
        """
        logger.info(f"Scraping repository: {repo_full_name}")
        
        files_downloaded = 0
        
        def process_directory(path: str = "", depth: int = 0):
            nonlocal files_downloaded
            
            if depth > 3 or files_downloaded >= max_files:
                return
            
            contents = self.get_repo_contents(repo_full_name, path)
            
            for item in contents:
                if files_downloaded >= max_files:
                    break
                
                if item['type'] == 'file':
                    # Check if it's a source file
                    if any(item['name'].endswith(ext) for ext in ['.cpp', '.py', '.java', '.c']):
                        if self.download_file(repo_full_name, item):
                            files_downloaded += 1
                            if files_downloaded % 10 == 0:
                                logger.info(f"  Downloaded {files_downloaded} files from {repo_full_name}")
                
                elif item['type'] == 'dir':
                    # Recursively process directories
                    # Skip common non-code directories
                    if item['name'].lower() not in ['test', 'tests', 'docs', 'images', '.git']:
                        time.sleep(0.5)  # Rate limiting
                        process_directory(item['path'], depth + 1)
        
        process_directory()
        
        self.stats['repos_processed'] += 1
        logger.info(f"✅ Downloaded {files_downloaded} files from {repo_full_name}")
        
        return files_downloaded
    
    def scrape_multiple_repos(self, max_repos: int = 10, max_files_per_repo: int = 200):
        """
        Scrape multiple repositories
        
        Args:
            max_repos: Maximum number of repositories to scrape
            max_files_per_repo: Maximum files per repository
        """
        logger.info("=" * 60)
        logger.info("Starting GitHub Codeforces Scraper")
        logger.info("=" * 60)
        
        # Search for repositories
        repos = self.search_repositories(max_repos)
        
        if not repos:
            logger.error("No repositories found!")
            return
        
        # Scrape each repository
        for i, repo in enumerate(repos, 1):
            logger.info(f"\nRepository {i}/{len(repos)}")
            self.scrape_repository(repo['full_name'], max_files_per_repo)
            
            # Save progress
            self.save_metadata()
            
            time.sleep(2)  # Rate limiting between repos
        
        # Final summary
        logger.info("\n" + "=" * 60)
        logger.info("Scraping Complete!")
        logger.info("=" * 60)
        logger.info(f"Repositories processed: {self.stats['repos_processed']}")
        logger.info(f"Files downloaded: {self.stats['files_downloaded']}")
        logger.info(f"Unique problems: {len(self.stats['problems_found'])}")
        logger.info(f"Languages: {dict(self.stats['languages'])}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info(f"Output directory: {self.output_dir.absolute()}")
        
        self.save_metadata()
    
    def save_metadata(self):
        """Save scraping metadata"""
        metadata = {
            'repos_processed': self.stats['repos_processed'],
            'files_downloaded': self.stats['files_downloaded'],
            'unique_problems': len(self.stats['problems_found']),
            'problems': sorted(list(self.stats['problems_found'])),
            'languages': dict(self.stats['languages']),
            'errors': self.stats['errors']
        }
        
        metadata_path = self.output_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved to {metadata_path}")


def main():
    """Main scraping function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape Codeforces solutions from GitHub')
    parser.add_argument(
        '--output-dir',
        default='./data/codeforces',
        help='Output directory for scraped files'
    )
    parser.add_argument(
        '--max-repos',
        type=int,
        default=10,
        help='Maximum repositories to scrape (default: 10)'
    )
    parser.add_argument(
        '--max-files-per-repo',
        type=int,
        default=200,
        help='Maximum files per repository (default: 200)'
    )
    parser.add_argument(
        '--github-token',
        help='GitHub personal access token (get from https://github.com/settings/tokens)'
    )
    
    args = parser.parse_args()
    
    # Create scraper
    scraper = CodeforcesScraper(
        output_dir=args.output_dir,
        github_token=args.github_token
    )
    
    # Run scraping
    scraper.scrape_multiple_repos(
        max_repos=args.max_repos,
        max_files_per_repo=args.max_files_per_repo
    )


if __name__ == "__main__":
    main()