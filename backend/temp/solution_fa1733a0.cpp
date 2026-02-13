#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin>>n;
    vector<int>a(n);
    for(int i=0;i<n;i++) cin>>a[i];
    int target;
    cin>>target;

    unordered_map<int,int> mp;
    mp.reserve(n);              // prevents rehashing
    mp.max_load_factor(0.7);    // improves performance

    for(int i=0;i<n;i++){
        int need=target-a[i];
        if(mp.find(need)!=mp.end()){
            cout<<mp[need]<<" "<<i;
            return 0;
        }
        mp[a[i]]=i;
    }
}