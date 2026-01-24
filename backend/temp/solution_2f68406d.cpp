#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    cin >> n;
    vector<int> a(n);
    for(int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    int target;
    cin >> target;
    
    cout << "DEBUG: n=" << n << ", target=" << target << endl; // Add debug output
    
    int l = 0, r = n - 1, ans = -1;
    while(l <= r){
        int m = l + (r - l) / 2;
        cout << "DEBUG: l=" << l << ", r=" << r << ", m=" << m << ", a[m]=" << a[m] << endl; // Add debug
        
        if(a[m] == target){
            ans = m;
            break;
        }
        if(a[l] <= a[m]){  // Left half is sorted
            if(a[l] <= target && target < a[m]){
                r = m - 1;
            } else {
                l = m + 1;
            }
        } else {  // Right half is sorted
            if(a[m] < target && target <= a[r]){
                l = m + 1;
            } else {
                r = m - 1;
            }
        }
    }
    
    cout << ans;
    return 0;
}