#include <iostream>
#include <stack>
#include <string>
#include <unordered_map>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    unordered_map<char, char> brackets = {
        {')', '('},
        {'}', '{'},
        {']', '['}
    };
    
    for (char c : s) {
        if (brackets.count(c)) {
            if (st.empty() || st.top() != brackets[c]) {
                return false;
            }
            st.pop();
        } else {
            st.push(c);
        }
    }
    
    return st.empty();
}

int main() {
    string s;
    cout << "Enter string: ";
    getline(cin, s);
    
    cout << (isValid(s) ? "true" : "false") << endl;
    
    return 0;
}