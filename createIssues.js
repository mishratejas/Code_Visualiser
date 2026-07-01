const { execSync } = require("child_process");

const issues = [
["Implement Real-time Collaborative Coding","Build shared coding environment using Socket.IO and collaborative synchronization.","advanced,feature"],

["Build Advanced Plagiarism Detection Pipeline","Enhance plagiarism detection using AST and similarity analysis.","advanced,AI,backend"],

["Implement Contest Virtual Participation","Allow users to participate in previous contests in virtual mode.","advanced,frontend,backend"],

["Build Automated Test Case Generator","Generate test cases automatically using AI.","advanced,AI"],

["Implement Distributed Code Execution","Scale execution using Docker workers and queues.","advanced,backend,devops"],

["Build AI-Powered Code Review Bot","Create AI-based code review and improvement suggestions.","advanced,AI,integration"]
];

issues.forEach(([title,body,labels])=>{
try{
execSync(
`gh issue create --title "${title}" --body "${body}" --label "${labels}"`,
{stdio:"inherit"}
);
console.log("Created:",title);
}catch(e){
console.log("Failed:",title);
}
});

console.log("Advanced issues created");