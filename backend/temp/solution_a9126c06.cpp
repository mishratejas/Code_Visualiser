#include <bits/stdc++.h>
using namespace std;

int maxSubArray(vector<int>& nums){
    int cur=nums[0],best=nums[0];
    for(int i=1;i<nums.size();i++){
        cur=max(nums[i],cur+nums[i]);
        best=max(best,cur);
    }
    return best;
}

int main(){
    int n;
    cin>>n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin>>nums[i];
    cout<<maxSubArray(nums);
    return 0;
}