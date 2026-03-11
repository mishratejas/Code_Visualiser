#include <iostream>
#include <stack>
#include <unordered_map>
#include <string>

using namespace std;

bool isValid(string s) {
    stack<char> st;
    // Map closing brackets to their corresponding opening brackets
    unordered_map<char, char> bracketMap = {
        {')', '('},
        {'}', '{'},
        {']', '['}
    };

    for (char c : s) {
        // If the character is a closing bracket
        if (bracketMap.count(c)) {
            // Check if stack is empty or top doesn't match
            if (st.empty() || st.top() != bracketMap[c]) {
                return false;
            }
            st.pop(); // Successfully matched
        } else {
            // It's an opening bracket, push to stack
            st.push(c);
        }
    }

    // If stack is empty, all brackets were matched
    return st.empty();
}

int main() {
    string s;
    cin >> s;
    if (isValid(s)) {
        cout << "true" << endl;
    } else {
        cout << "false" << endl;
    }
    return 0;
}