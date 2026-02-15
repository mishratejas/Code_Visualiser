#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin>>n;
    vector<int> coins(n);
    for(int i=0;i<n;i++) cin>>coins[i];

    int amount;
    cin>>amount;

    const int INF = 1e9;
    vector<int> dp(amount+1, INF);
    dp[0] = 0;

    for(int c : coins){
        for(int x=c; x<=amount; x++){
            dp[x] = min(dp[x], dp[x-c] + 1);
        }
    }

    if(dp[amount] == INF) cout << -1;
    else cout << dp[amount];
}