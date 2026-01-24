#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin >> nums[i];

    long long expected = 1LL*n*(n+1)/2;
    long long actual = 0;
    for(int x : nums) actual += x;

    cout << expected - actual;
    return 0;
}