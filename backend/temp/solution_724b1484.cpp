struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        // Base case: if the tree is empty
        if (root == nullptr) {
            return nullptr;
        }

        // Swap the left and right pointers
        TreeNode* temp = root->left;
        root->left = root->right;
        root->right = temp;

        // Recursively call for children
        invertTree(root->left);
        invertTree(root->right);

        return root;
    }
};