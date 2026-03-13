#include <iostream>
#include <vector>
#include <queue>
#include <sstream>
#include <algorithm>

using namespace std;

// Definition for a binary tree node.
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

// Core Logic: The Inversion
TreeNode* invertTree(TreeNode* root) {
    if (root == nullptr) return nullptr;

    // Swap children
    TreeNode* temp = root->left;
    root->left = root->right;
    root->right = temp;

    // Recursively invert subtrees
    invertTree(root->left);
    invertTree(root->right);

    return root;
}

// Helper: Build tree from level-order input
TreeNode* buildTree(string input) {
    if (input.empty()) return nullptr;
    stringstream ss(input);
    string val;
    ss >> val;
    if (val == "null") return nullptr;

    TreeNode* root = new TreeNode(stoi(val));
    queue<TreeNode*> q;
    q.push(root);

    while (!q.empty() && ss >> val) {
        TreeNode* curr = q.front();
        q.pop();

        if (val != "null") {
            curr->left = new TreeNode(stoi(val));
            q.push(curr->left);
        }
        if (ss >> val && val != "null") {
            curr->right = new TreeNode(stoi(val));
            q.push(curr->right);
        }
    }
    return root;
}

// Helper: Print tree in level-order
void printLevelOrder(TreeNode* root) {
    if (!root) return;
    queue<TreeNode*> q;
    q.push(root);
    bool first = true;
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (!first) cout << " ";
        cout << curr->val;
        first = false;
        if (curr->left) q.push(curr->left);
        if (curr->right) q.push(curr->right);
    }
    cout << endl;
}

int main() {
    string line;
    if (getline(cin, line)) {
        TreeNode* root = buildTree(line);
        root = invertTree(root);
        printLevelOrder(root);
    }
    return 0;
}