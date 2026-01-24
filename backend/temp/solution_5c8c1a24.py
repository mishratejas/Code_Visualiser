n=int(input().strip())
nums=list(map(int,input().split()))
ans=0
for x in nums:
    ans^=x
print(ans)