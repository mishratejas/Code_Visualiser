#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>

using namespace std;

int maxProfit(int n, vector<int>& prices) {
    if (n <= 1) return 0;

    int minPrice = INT_MAX;
    int maxProfit = 0;

    for (int i = 0; i < n; i++) {
        // Update the lowest price we've seen so far
        if (prices[i] < minPrice) {
            minPrice = prices[i];
        } 
        // Or check if selling today yields a better profit
        else if (prices[i] - minPrice > maxProfit) {
            maxProfit = prices[i] - minPrice;
        }
    }

    return maxProfit;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;

    vector<int> prices(n);
    for (int i = 0; i < n; i++) {
        cin >> prices[i];
    }

    cout << maxProfit(n, prices) << endl;

    return 0;
}