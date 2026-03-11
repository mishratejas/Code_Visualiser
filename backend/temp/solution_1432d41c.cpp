#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

void solve() {
    string s;
    // Read the entire line as the string
    if (!(cin >> s)) return;

    int left = 0;
    int right = s.length() - 1;

    // Swap characters until pointers meet
    while (left < right) {
        // Standard swap function
        swap(s[left], s[right]);
        
        // Move pointers toward the center
        left++;
        right--;
    }

    cout << s << endl;
}

int main() {
    // Optimize I/O operations
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    solve();
    return 0;
}