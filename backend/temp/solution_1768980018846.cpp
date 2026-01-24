#include <bits/stdc++.h>
using namespace std;

bool canConstruct(string ransomNote,string magazine){
    vector<int> freq(26,0);
    for(char c:magazine) freq[c-'a']++;
    for(char c:ransomNote){
        if(--freq[c-'a']<0) return false;
    }
    return true;
}

int main(){
    string ransomNote,magazine;
    cin>>ransomNote>>magazine;
    if(canConstruct(ransomNote,magazine))
        cout<<"true";
    else
        cout<<"false";
    return 0;
}