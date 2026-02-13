"""
Prepare scraped Codeforces solutions for training.

This script processes the lightweight GitHub-scraped data into training datasets.
Much faster and lighter than Project CodeNet!
"""

import pandas as pd
import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple
import random

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CodeforcesSolutionProcessor:
    """Process scraped Codeforces solutions"""
    
    def __init__(self, codeforces_dir: str, output_dir: str):
        """
        Initialize processor
        
        Args:
            codeforces_dir: Directory with scraped solutions
            output_dir: Output directory for processed data
        """
        self.codeforces_dir = Path(codeforces_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def load_scraped_files(self) -> List[Dict]:
        """Load all scraped solution files"""
        logger.info(f"Loading scraped files from {self.codeforces_dir}")
        
        records = []
        languages = ['cpp', 'python', 'java', 'c', 'csharp', 'javascript']
        
        for language in languages:
            lang_dir = self.codeforces_dir / language
            
            if not lang_dir.exists():
                continue
            
            for file_path in lang_dir.glob('*'):
                if not file_path.is_file():
                    continue
                
                try:
                    # Read code
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        code = f.read()
                    
                    if not code or len(code.strip()) == 0:
                        continue
                    
                    # Parse filename: {problem_id}_{repo}_{original_filename}
                    filename = file_path.name
                    parts = filename.split('_', 2)
                    
                    problem_id = parts[0] if len(parts) > 0 else 'unknown'
                    
                    record = {
                        'problem_id': problem_id,
                        'language': language,
                        'code': code,
                        'code_size': len(code),
                        'filename': filename,
                    }
                    
                    records.append(record)
                    
                except Exception as e:
                    logger.error(f"Error reading {file_path}: {e}")
        
        logger.info(f"Loaded {len(records)} solution files")
        return records
    
    def assign_labels(self, records: List[Dict]) -> List[Dict]:
        """
        Assign quality and complexity labels
        
        Since we don't have actual verdict data from GitHub scraping,
        we'll use heuristics based on code characteristics.
        """
        logger.info("Assigning labels based on code characteristics...")
        
        for record in records:
            code = record['code']
            
            # Quality heuristics (simple but effective)
            quality_score = 0
            
            # Good signs
            if len(code) < 5000:  # Not too long
                quality_score += 1
            if code.count('\n') > 5:  # Has multiple lines
                quality_score += 1
            if any(keyword in code.lower() for keyword in ['int main', 'def ', 'public ', 'function']):
                quality_score += 1
            if code.count('{') == code.count('}'):  # Balanced braces
                quality_score += 1
            if not any(bad in code.lower() for bad in ['todo', 'fixme', 'hack', 'wrong']):
                quality_score += 1
            
            # Assign quality label
            if quality_score >= 4:
                record['quality_label'] = 'good'
            elif quality_score >= 2:
                record['quality_label'] = 'average'
            else:
                record['quality_label'] = 'poor'
            
            # Complexity heuristics
            num_loops = code.count('for') + code.count('while')
            num_recursive = False  # recursion detection disabled (heuristic)

            
            if num_loops == 0 and not num_recursive:
                record['complexity_class'] = 'O(1)'
            elif num_loops == 1 and not num_recursive:
                record['complexity_class'] = 'O(n)'
            elif num_loops == 1 and ('sort' in code.lower() or 'binary' in code.lower()):
                record['complexity_class'] = 'O(n log n)'
            elif num_loops == 2:
                record['complexity_class'] = 'O(n^2)'
            elif num_loops >= 3:
                record['complexity_class'] = 'O(n^3)'
            else:
                record['complexity_class'] = 'O(n)'  # Default
        
        return records
    
    def prepare_dataset(self, train_split: float = 0.8) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Prepare training and test datasets
        
        Args:
            train_split: Fraction for training set
            
        Returns:
            (train_df, test_df)
        """
        # Load scraped files
        records = self.load_scraped_files()
        
        if not records:
            raise ValueError("No data found! Run scraper first.")
        
        # Assign labels
        records = self.assign_labels(records)
        
        # Create DataFrame
        df = pd.DataFrame(records)
        
        logger.info(f"\nTotal samples: {len(df)}")
        logger.info(f"\nQuality distribution:\n{df['quality_label'].value_counts()}")
        logger.info(f"\nComplexity distribution:\n{df['complexity_class'].value_counts()}")
        logger.info(f"\nLanguage distribution:\n{df['language'].value_counts()}")
        logger.info(f"\nUnique problems: {df['problem_id'].nunique()}")
        
        # Shuffle
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        # Split train/test
        split_idx = int(len(df) * train_split)
        train_df = df[:split_idx]
        test_df = df[split_idx:]
        
        logger.info(f"\nTrain set: {len(train_df)} samples")
        logger.info(f"Test set: {len(test_df)} samples")
        
        return train_df, test_df
    
    def save_datasets(self, train_df: pd.DataFrame, test_df: pd.DataFrame):
        """Save datasets to CSV files"""
        train_path = self.output_dir / "cf_train.csv"
        test_path = self.output_dir / "cf_test.csv"
        
        train_df.to_csv(train_path, index=False)
        test_df.to_csv(test_path, index=False)
        
        logger.info(f"\n✅ Datasets saved:")
        logger.info(f"  Train: {train_path}")
        logger.info(f"  Test: {test_path}")
        
        # Save statistics
        stats = {
            'train_size': len(train_df),
            'test_size': len(test_df),
            'total_size': len(train_df) + len(test_df),
            'languages': train_df['language'].value_counts().to_dict(),
            'quality_labels': train_df['quality_label'].value_counts().to_dict(),
            'complexity_classes': train_df['complexity_class'].value_counts().to_dict(),
            'unique_problems': int(train_df['problem_id'].nunique()),
        }
        
        stats_path = self.output_dir / "cf_stats.json"
        with open(stats_path, 'w') as f:
            json.dump(stats, f, indent=2)
        
        logger.info(f"  Stats: {stats_path}")


def main():
    """Main processing function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare Codeforces scraped data')
    parser.add_argument(
        '--codeforces-dir',
        default='./data/codeforces',
        help='Directory with scraped Codeforces solutions'
    )
    parser.add_argument(
        '--output-dir',
        default='./data/processed',
        help='Output directory for processed data'
    )
    parser.add_argument(
        '--train-split',
        type=float,
        default=0.8,
        help='Train/test split ratio (default: 0.8)'
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Codeforces Solution Data Preparation")
    logger.info("=" * 60)
    logger.info(f"Input: {args.codeforces_dir}")
    logger.info(f"Output: {args.output_dir}")
    logger.info("=" * 60)
    
    # Create processor
    processor = CodeforcesSolutionProcessor(
        codeforces_dir=args.codeforces_dir,
        output_dir=args.output_dir
    )
    
    # Prepare datasets
    train_df, test_df = processor.prepare_dataset(train_split=args.train_split)
    
    # Save datasets
    processor.save_datasets(train_df, test_df)
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ Data preparation complete!")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()