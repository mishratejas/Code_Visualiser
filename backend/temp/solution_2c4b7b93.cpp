#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n,target;
    cin>>n;
    cin>>target;

    vector<long long>a(n);
    for(int i=0;i<n;i++) cin>>a[i];

    int l=0,r=n-1;
    while(l<=r){
        int mid=l+(r-l)/2;
        if(a[mid]==target){
            cout<<mid;
            return 0;
        }
        else if(a[mid]<target) l=mid+1;
        else r=mid-1;
    }

    cout<<-1;
    return 0;
}