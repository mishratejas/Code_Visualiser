#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin>>n;
    int x,ans=0;
    for(int i=0;i<n;i++){
        cin>>x;
        ans^=x;
    }
    cout<<ans;
    return 0;
}