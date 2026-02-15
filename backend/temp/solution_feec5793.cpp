#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin>>n;
    vector<int> h(n);
    for(int i=0;i<n;i++) cin>>h[i];

    int l=0,r=n-1;
    int leftMax=0,rightMax=0;
    long long water=0;

    while(l<r){
        if(h[l]<=h[r]){
            if(h[l]>=leftMax) leftMax=h[l];
            else water+=leftMax-h[l];
            l++;
        }else{
            if(h[r]>=rightMax) rightMax=h[r];
            else water+=rightMax-h[r];
            r--;
        }
    }

    cout<<water;
}