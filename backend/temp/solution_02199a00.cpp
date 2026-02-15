#include <bits/stdc++.h>
using namespace std;

int m,n;
vector<vector<char>> grid;
string word;

bool dfs(int i,int j,int idx){
    if(idx==word.size()) return true;
    if(i<0||j<0||i>=m||j>=n||grid[i][j]!=word[idx])
        return false;

    char temp=grid[i][j];
    grid[i][j]='#';   // mark visited

    bool found=
        dfs(i+1,j,idx+1)||
        dfs(i-1,j,idx+1)||
        dfs(i,j+1,idx+1)||
        dfs(i,j-1,idx+1);

    grid[i][j]=temp; // backtrack
    return found;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    cin>>m>>n;
    grid.assign(m,vector<char>(n));

    for(int i=0;i<m;i++)
        for(int j=0;j<n;j++)
            cin>>grid[i][j];

    cin>>word;

    for(int i=0;i<m;i++){
        for(int j=0;j<n;j++){
            if(dfs(i,j,0)){
                cout<<"true";
                return 0;
            }
        }
    }
    cout<<"false";
}