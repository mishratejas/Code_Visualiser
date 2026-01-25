#include <bits/stdc++.h>
using namespace std;

int main(){
    int n,m;
    cin>>n>>m;

    vector<int>a(n),b(m);
    for(int i=0;i<n;i++) cin>>a[i];
    for(int i=0;i<m;i++) cin>>b[i];

    unordered_set<int>s1(a.begin(),a.end());
    unordered_set<int>res;

    for(int x:b){
        if(s1.count(x)) res.insert(x);
    }

    for(int x:res) cout<<x<<" ";
    return 0;
}