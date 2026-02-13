#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin>>n;
    vector<int>a(n);
    for(int i=0;i<n;i++) cin>>a[i];
    int target;
    cin>>target;

    unordered_map<int,int> mp;
    for(int i=0;i<n;i++){
        int need=target-a[i];
        if(mp.count(need)){
            cout<<mp[need]<<" "<<i;
            return 0;
        }
        mp[a[i]]=i;
    }
}