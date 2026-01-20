#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> mergeIntervals(vector<vector<int>>& intervals){
    if(intervals.empty()) return {};
    sort(intervals.begin(),intervals.end());
    vector<vector<int>> res;
    res.push_back(intervals[0]);
    for(int i=1;i<intervals.size();i++){
        if(intervals[i][0]<=res.back()[1]){
            res.back()[1]=max(res.back()[1],intervals[i][1]);
        }else{
            res.push_back(intervals[i]);
        }
    }
    return res;
}

int main(){
    int n;
    cin>>n;
    vector<vector<int>> intervals(n,vector<int>(2));
    for(int i=0;i<n;i++){
        cin>>intervals[i][0]>>intervals[i][1];
    }
    vector<vector<int>> ans=mergeIntervals(intervals);
    for(auto &v:ans){
        cout<<v[0]<<" "<<v[1]<<endl;
    }
    return 0;
}