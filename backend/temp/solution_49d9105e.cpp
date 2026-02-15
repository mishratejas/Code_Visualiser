#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin>>n;

    if(n<=2){
        cout<<n;
        return 0;
    }

    long long a=1,b=2;
    for(int i=3;i<=n;i++){
        long long c=a+b;
        a=b;
        b=c;
    }

    cout<<b;
}