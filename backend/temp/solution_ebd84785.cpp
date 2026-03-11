#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;

    // Handle edge case where no transaction can be made
    if (n < 2) {
        int temp;
        for(int i = 0; i < n; i++) cin >> temp;
        cout << 0 << endl;
        return 0;
    }

    int min_price = INT_MAX;
    int max_profit = 0;

    for (int i = 0; i < n; i++) {
        int current_price;
        cin >> current_price;

        // Update the minimum price seen so far
        if (current_price < min_price) {
            min_price = current_price;
        } 
        // Check if selling at current price gives a better profit
        else if (current_price - min_price > max_profit) {
            max_profit = current_price - min_price;
        }
    }

    cout << max_profit << endl;

    return 0;
}