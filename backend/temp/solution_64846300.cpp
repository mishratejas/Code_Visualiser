#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin>>n;

    long long x,curr,best;
    cin>>x;
    curr=best=x;

    for(int i=1;i<n;i++){
        cin>>x;
        curr=max(x,curr+x);
        best=max(best,curr);
    }

    cout<<best;
    return 0;
}