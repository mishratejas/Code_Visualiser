# CodeForge - Good First Issues

A curated list of issues for new contributors organized by difficulty level.

---

## 🟢 Beginner Issues (10)

Perfect for first-time contributors or those new to the codebase.

### Issue #1: Add Loading Skeleton for Problem List
**Labels**: `good-first-issue`, `frontend`, `UI/UX`

**Description:**
The problem list shows a generic "Loading..." text. Replace it with skeleton loading cards for better UX.

**Tasks:**
- [ ] Create a `ProblemCardSkeleton` component
- [ ] Use it in `Problems.jsx` while data is loading
- [ ] Match the skeleton to actual card dimensions
- [ ] Add shimmer animation effect

**Files to modify:**
- `FRONTEND/src/components/problems/ProblemCard.jsx`
- `FRONTEND/src/pages/Problems.jsx`

**Acceptance Criteria:**
- Skeleton shows before problems load
- Skeleton matches card layout
- Smooth transition when data loads

**Estimated Time:** 2-3 hours

---

### Issue #2: Add Code Copy Button to Submission Details
**Labels**: `good-first-issue`, `frontend`, `enhancement`

**Description:**
Users want to easily copy their submitted code. Add a "Copy Code" button to the submission detail page.

**Tasks:**
- [ ] Add copy button to code display section
- [ ] Implement copy-to-clipboard functionality
- [ ] Show success toast after copying
- [ ] Add icon (copy icon → checkmark on success)

**Files to modify:**
- `FRONTEND/src/pages/Submissions.jsx` or submission detail component
- Use `react-hot-toast` for notifications

**Acceptance Criteria:**
- Button appears next to code
- Clicking copies code to clipboard
- Shows "Copied!" feedback

**Estimated Time:** 1-2 hours

---

### Issue #3: Display Language Icons in Submission List
**Labels**: `good-first-issue`, `frontend`, `UI/UX`

**Description:**
Show programming language icons (C++, Python, Java) instead of just text in the submissions list.

**Tasks:**
- [ ] Find/create icon set for languages (or use existing library)
- [ ] Create language icon mapping
- [ ] Update submission list to show icons
- [ ] Add tooltips with language name

**Files to modify:**
- `FRONTEND/src/components/submissions/SubmissionList.jsx`
- `FRONTEND/src/utils/languageIcons.js` (create this)

**Acceptance Criteria:**
- Icons appear for each language
- Tooltip shows full language name
- Icons are consistent size/style

**Estimated Time:** 2-3 hours

---

### Issue #4: Add Footer to All Pages
**Labels**: `good-first-issue`, `frontend`, `UI/UX`

**Description:**
The app is missing a footer. Add a footer component with basic info (links, copyright, social media).

**Tasks:**
- [ ] Create `Footer.jsx` component
- [ ] Add links: About, Help, Privacy, Terms
- [ ] Add social media icons (GitHub, Twitter)
- [ ] Add copyright notice
- [ ] Include it in App layout

**Files to create/modify:**
- `FRONTEND/src/components/common/Footer.jsx` (create)
- `FRONTEND/src/App.jsx` (include footer)

**Acceptance Criteria:**
- Footer appears on all pages
- Links are functional
- Responsive design (mobile friendly)

**Estimated Time:** 2-3 hours

---

### Issue #5: Add Environment Variables Documentation
**Labels**: `good-first-issue`, `documentation`, `backend`

**Description:**
Create a `.env.example` file for the backend with all required environment variables documented.

**Tasks:**
- [ ] List all env vars used in the backend
- [ ] Create `.env.example` file
- [ ] Add comments explaining each variable
- [ ] Update README with setup instructions

**Files to create:**
- `BACKEND/.env.example`
- Update `BACKEND/README.md`

**Acceptance Criteria:**
- All required variables listed
- Clear descriptions for each
- Works for new developers

**Estimated Time:** 1-2 hours

---

### Issue #6: Add Dark Mode Toggle Icon
**Labels**: `good-first-issue`, `frontend`, `UI/UX`

**Description:**
If dark mode exists, add a sun/moon toggle icon in the navbar. If not, create basic dark mode support.

**Tasks:**
- [ ] Add theme toggle button in navbar
- [ ] Use sun icon for light mode, moon for dark
- [ ] Persist selection in localStorage
- [ ] Add smooth transition

**Files to modify:**
- `FRONTEND/src/components/Navbar.jsx` (or similar)
- `FRONTEND/src/context/ThemeContext.jsx` (if exists, else create)

**Acceptance Criteria:**
- Toggle switches between themes
- Icon changes based on mode
- Preference persists on reload

**Estimated Time:** 3-4 hours

---

### Issue #7: Add "Last Updated" Timestamp to Problems
**Labels**: `good-first-issue`, `frontend`, `enhancement`

**Description:**
Show when each problem was last updated in the problem list/detail page.

**Tasks:**
- [ ] Add timestamp to problem cards
- [ ] Format as relative time ("2 days ago")
- [ ] Use a library like `date-fns` or `moment`
- [ ] Show on hover as tooltip with exact date

**Files to modify:**
- `FRONTEND/src/components/problems/ProblemCard.jsx`
- `FRONTEND/src/pages/Problem.jsx`

**Acceptance Criteria:**
- Shows relative time
- Tooltip shows exact date/time
- Works for all problems

**Estimated Time:** 2 hours

---

### Issue #8: Add Search Placeholder Text Examples
**Labels**: `good-first-issue`, `frontend`, `UI/UX`

**Description:**
Make search bars more intuitive by adding helpful placeholder text with examples.

**Tasks:**
- [ ] Update problem search: "Search problems (e.g., Two Sum, Array)..."
- [ ] Update user search: "Search users (e.g., @username)..."
- [ ] Update contest search: "Search contests..."
- [ ] Make placeholders fade in/out if possible

**Files to modify:**
- `FRONTEND/src/pages/Problems.jsx`
- Any other search components

**Acceptance Criteria:**
- Clear, helpful placeholders
- Examples relevant to search type
- Improves user experience

**Estimated Time:** 1 hour

---

### Issue #9: Create API Health Check Endpoint
**Labels**: `good-first-issue`, `backend`, `monitoring`

**Description:**
Add a `/health` endpoint to check if backend services are running.

**Tasks:**
- [ ] Create `/api/health` endpoint
- [ ] Return status of: database, redis, AI service
- [ ] Include uptime and version info
- [ ] Document endpoint in README

**Files to modify:**
- `BACKEND/src/routes/health.js` (create)
- `BACKEND/src/app.js` (add route)

**Acceptance Criteria:**
- Returns 200 OK when healthy
- Shows status of each service
- Useful for monitoring/debugging

**Estimated Time:** 2-3 hours

---

### Issue #10: Add Keyboard Shortcuts Documentation
**Labels**: `good-first-issue`, `documentation`, `frontend`

**Description:**
Document existing keyboard shortcuts (if any) or suggest useful ones to implement.

**Tasks:**
- [ ] List current keyboard shortcuts
- [ ] Create a "Keyboard Shortcuts" help modal
- [ ] Show modal with `?` key or help menu
- [ ] Document shortcuts in user guide

**Files to create:**
- `FRONTEND/src/components/help/KeyboardShortcuts.jsx`
- Add trigger in navbar or help section

**Acceptance Criteria:**
- Modal lists all shortcuts
- Easy to access (? key or menu)
- Helps users navigate faster

**Estimated Time:** 3-4 hours

---

## 🟡 Medium Issues (6)

Requires understanding of the codebase and some experience with the tech stack.

### Issue #11: Implement Problem Difficulty Filter with Stats
**Labels**: `enhancement`, `frontend`, `backend`

**Description:**
Add a filter to show problems by difficulty (Easy/Medium/Hard) with solve statistics.

**Tasks:**
- [ ] Add difficulty filter UI in problems page
- [ ] Create backend endpoint `/api/problems/stats` for counts
- [ ] Show: "Easy (234 solved / 500 total)"
- [ ] Update problem list based on selection
- [ ] Persist filter in URL query params

**Files to modify:**
- `FRONTEND/src/pages/Problems.jsx`
- `BACKEND/src/routes/problems.js`
- `BACKEND/src/controllers/problemController.js`

**Acceptance Criteria:**
- Filter works correctly
- Shows accurate counts
- Shareable filtered URLs

**Estimated Time:** 6-8 hours

---

### Issue #12: Add Submission Comparison Feature
**Labels**: `enhancement`, `frontend`, `feature`

**Description:**
Allow users to compare two of their submissions side-by-side (code, performance, AI analysis).

**Tasks:**
- [ ] Add "Compare" checkbox to submission list
- [ ] Create comparison view component
- [ ] Show code side-by-side with diff highlighting
- [ ] Compare execution time, memory, quality scores
- [ ] Add "Compare with best submission" quick action

**Files to create:**
- `FRONTEND/src/pages/CompareSubmissions.jsx`
- `FRONTEND/src/components/submissions/SubmissionComparison.jsx`

**Acceptance Criteria:**
- Can select 2 submissions
- Shows clear differences
- Highlights improvements/regressions

**Estimated Time:** 10-12 hours

---

### Issue #13: Implement Problem Tagging System
**Labels**: `enhancement`, `backend`, `database`

**Description:**
Add tagging system for problems (Arrays, DP, Graphs, etc.) with tag-based filtering.

**Tasks:**
- [ ] Design tag schema (MongoDB collection or array field)
- [ ] Create CRUD endpoints for tags
- [ ] Add tags to problem model
- [ ] Create tag management UI (admin)
- [ ] Add tag filter in problems page
- [ ] Show tag cloud/popular tags

**Files to modify:**
- `BACKEND/src/models/Problem.js`
- `BACKEND/src/routes/tags.js` (create)
- `FRONTEND/src/pages/Problems.jsx`

**Acceptance Criteria:**
- Tags stored in database
- Users can filter by tags
- Admins can manage tags
- Shows problem count per tag

**Estimated Time:** 12-15 hours

---

### Issue #14: Add Email Notifications for Contest Events
**Labels**: `enhancement`, `backend`, `feature`

**Description:**
Send email notifications when contests start, end, or when user ranking changes.

**Tasks:**
- [ ] Set up email service (Nodemailer already installed)
- [ ] Create email templates for:
  - Contest starting in 15 minutes
  - Contest results ready
  - Ranking improved
- [ ] Add notification preferences to user settings
- [ ] Implement queue for sending emails (Bull)
- [ ] Add unsubscribe functionality

**Files to modify:**
- `BACKEND/src/services/emailService.js` (create)
- `BACKEND/src/jobs/emailNotifications.js` (create)
- `BACKEND/src/models/User.js` (add preferences)

**Acceptance Criteria:**
- Emails sent at right times
- Users can opt in/out
- Emails are well-formatted
- Unsubscribe works

**Estimated Time:** 15-18 hours

---

### Issue #15: Implement Rate Limiting for Submissions
**Labels**: `enhancement`, `backend`, `security`

**Description:**
Prevent spam submissions by implementing rate limiting (max N submissions per minute).

**Tasks:**
- [ ] Use Redis to track submission counts
- [ ] Implement sliding window rate limit
- [ ] Set limits: 5 submissions/min, 30/hour
- [ ] Return clear error messages
- [ ] Add rate limit headers in response
- [ ] Exempt admins from limits

**Files to modify:**
- `BACKEND/src/middlewares/rateLimiter.js` (create)
- `BACKEND/src/routes/submissions.js`

**Acceptance Criteria:**
- Blocks excessive submissions
- Shows time until next allowed
- Doesn't affect normal usage

**Estimated Time:** 8-10 hours

---

### Issue #16: Add Code Execution History Graph
**Labels**: `enhancement`, `frontend`, `data-viz`

**Description:**
Show a graph of execution time/memory usage across submissions for each problem.

**Tasks:**
- [ ] Create endpoint to get submission history with metrics
- [ ] Use Recharts to create line graph
- [ ] Show execution time over time
- [ ] Show memory usage over time
- [ ] Add toggle between time/memory view
- [ ] Highlight accepted submissions in green

**Files to create:**
- `FRONTEND/src/components/submissions/SubmissionHistory.jsx`
- Update backend to return historical data

**Acceptance Criteria:**
- Graph shows trends clearly
- Interactive (hover shows details)
- Helps users track improvement

**Estimated Time:** 10-12 hours

---

## 🔴 Advanced Issues (6)

Requires deep understanding of system architecture and advanced programming skills.

### Issue #17: Implement Real-time Collaborative Coding
**Labels**: `feature`, `advanced`, `socket.io`

**Description:**
Allow multiple users to code together in real-time on practice problems (like Google Docs for code).

**Tasks:**
- [ ] Set up Socket.IO room system for problems
- [ ] Implement Operational Transformation or CRDT for sync
- [ ] Show multiple cursors with user names
- [ ] Add presence indicators (who's viewing)
- [ ] Handle conflicts and concurrent edits
- [ ] Add chat sidebar for collaboration

**Files to create:**
- `BACKEND/src/socket/collaborative.js`
- `FRONTEND/src/components/editor/CollaborativeEditor.jsx`

**Acceptance Criteria:**
- Real-time syncing works smoothly
- No conflicts or data loss
- Shows all active users
- Performance handles 10+ concurrent users

**Estimated Time:** 30-40 hours

---

### Issue #18: Build Advanced Plagiarism Detection Pipeline
**Labels**: `feature`, `advanced`, `AI`, `backend`

**Description:**
Enhance plagiarism detection with AST-based comparison and automated reporting.

**Tasks:**
- [ ] Implement AST parsing for multiple languages
- [ ] Create similarity scoring algorithm (Winnowing)
- [ ] Build comparison matrix for all contest submissions
- [ ] Generate detailed reports with code diffs
- [ ] Add admin dashboard for reviewing cases
- [ ] Implement caching for expensive comparisons
- [ ] Add machine learning model for false positive reduction

**Files to modify:**
- `AI-Service/src/services/plagiarism.py`
- `BACKEND/src/services/plagiarism.js`
- Create admin UI in frontend

**Acceptance Criteria:**
- Detects similar code across language variations
- Low false positive rate (<5%)
- Processes 1000 submissions in <5 minutes
- Clear, actionable reports

**Estimated Time:** 40-50 hours

---

### Issue #19: Implement Contest Virtual Participation
**Labels**: `feature`, `advanced`, `backend`, `frontend`

**Description:**
Allow users to participate in past contests as if they were live (virtual mode).

**Tasks:**
- [ ] Create virtual contest sessions
- [ ] Implement separate leaderboard for virtual participants
- [ ] Enforce same time limits as original
- [ ] Track virtual vs real participants
- [ ] Show both real and virtual rankings
- [ ] Allow pausing/resuming virtual contests
- [ ] Send notifications during virtual contest

**Files to modify:**
- `BACKEND/src/models/Contest.js`
- `BACKEND/src/controllers/contestController.js`
- `FRONTEND/src/pages/LiveContest.jsx`

**Acceptance Criteria:**
- Virtual mode works like live
- Separate rankings maintained
- Can't cheat by seeing solutions
- Performance metrics tracked separately

**Estimated Time:** 25-30 hours

---

### Issue #20: Build Automated Test Case Generator
**Labels**: `feature`, `advanced`, `AI`, `backend`

**Description:**
Use AI to automatically generate test cases for problems based on constraints.

**Tasks:**
- [ ] Parse problem statement and extract constraints
- [ ] Generate edge cases automatically:
  - Empty input
  - Maximum constraints
  - Minimum constraints
  - Random valid inputs
- [ ] Verify generated tests with solution
- [ ] Store generated tests with confidence scores
- [ ] Add admin review/approval workflow
- [ ] Integrate with problem creation

**Files to create:**
- `AI-Service/src/services/test_generator.py`
- `BACKEND/src/services/testCaseGenerator.js`

**Acceptance Criteria:**
- Generates valid test cases
- Covers edge cases automatically
- 80%+ of generated cases are useful
- Reduces manual test creation time

**Estimated Time:** 35-45 hours

---

### Issue #21: Implement Distributed Code Execution
**Labels**: `feature`, `advanced`, `backend`, `devops`

**Description:**
Scale code execution across multiple workers using message queues and Docker containers.

**Tasks:**
- [ ] Set up worker pool with Bull queue
- [ ] Containerize code execution (Docker per submission)
- [ ] Implement load balancing across workers
- [ ] Add resource limits (CPU, memory, time)
- [ ] Handle worker failures gracefully
- [ ] Monitor queue health and metrics
- [ ] Add retry logic for failed executions

**Files to modify:**
- `BACKEND/src/services/executor.js`
- `BACKEND/src/jobs/codeExecution.js`
- Create Docker setup in `BACKEND/docker/`

**Acceptance Criteria:**
- Handles 100+ concurrent executions
- Isolated execution environments
- No resource exhaustion
- Automatic failure recovery

**Estimated Time:** 40-50 hours

---

### Issue #22: Build AI-Powered Code Review Bot
**Labels**: `feature`, `advanced`, `AI`, `integration`

**Description:**
Create a bot that reviews submissions and provides automated feedback like a human reviewer.

**Tasks:**
- [ ] Analyze code structure and patterns
- [ ] Detect common anti-patterns
- [ ] Suggest better algorithms/data structures
- [ ] Identify code smells
- [ ] Generate natural language explanations
- [ ] Compare with best solutions
- [ ] Provide personalized improvement tips
- [ ] Integrate with submission flow

**Files to create:**
- `AI-Service/src/services/code_reviewer.py`
- Use LLM API (OpenAI/Claude/local model)
- `BACKEND/src/services/codeReview.js`

**Acceptance Criteria:**
- Reviews are helpful and accurate
- Natural language explanations
- Doesn't just repeat lint errors
- Provides learning value
- Response time <30 seconds

**Estimated Time:** 50-60 hours

---

## 📋 Issue Template Format

When creating issues, use this template:

```markdown
### [Issue Title]

**Description:**
[Clear description of the problem or feature]

**Why is this needed?**
[Business value or user benefit]

**Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Files to modify:**
- `path/to/file1.js`
- `path/to/file2.jsx`

**Acceptance Criteria:**
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

**Additional Context:**
[Screenshots, mockups, references]

**Estimated Time:** X hours

**Labels:** `label1`, `label2`, `label3`
```

---

## 🏷️ Label Definitions

Use these labels for better organization:

**Difficulty:**
- `good-first-issue` - Perfect for beginners
- `intermediate` - Requires some experience
- `advanced` - Complex, multi-component changes

**Type:**
- `bug` - Something isn't working
- `enhancement` - Improve existing feature
- `feature` - New functionality
- `documentation` - Docs improvements

**Area:**
- `frontend` - React/UI changes
- `backend` - Node.js/API changes
- `AI` - Python/ML changes
- `database` - Schema or query changes
- `devops` - Infrastructure/deployment

**Priority:**
- `high` - Critical, do ASAP
- `medium` - Important, schedule soon
- `low` - Nice to have

---

## 🚀 Getting Started

### For Beginners:
1. Pick an issue labeled `good-first-issue`
2. Comment "I'd like to work on this"
3. Fork the repository
4. Create a branch: `git checkout -b issue-#-description`
5. Make changes and test
6. Submit PR referencing the issue

### For Contributors:
1. Check dependencies between issues
2. Read related code before starting
3. Ask questions if unclear
4. Update tests
5. Update documentation

---

## 📊 Issue Statistics

**Total Issues:** 22
- 🟢 Beginner: 10 (45%)
- 🟡 Medium: 6 (27%)
- 🔴 Advanced: 6 (27%)

**By Area:**
- Frontend: 10
- Backend: 8
- AI Service: 3
- Full Stack: 4
- DevOps: 2
- Documentation: 2

**Total Estimated Time:**
- Beginner: 20-27 hours
- Medium: 61-75 hours
- Advanced: 220-275 hours

---

## 💡 Tips for Success

### Writing Good Issues:
✅ Clear title that describes the change
✅ Detailed description with context
✅ Specific, actionable tasks
✅ Measurable acceptance criteria
✅ Time estimate
✅ Relevant labels

### Working on Issues:
✅ Start with good-first-issues
✅ One issue at a time
✅ Ask questions early
✅ Write tests
✅ Update docs
✅ Small, focused commits

---

## 📚 Additional Resources

- **Contributing Guide**: `CONTRIBUTING.md` (create this)
- **Code Style Guide**: `STYLE_GUIDE.md` (create this)
- **Architecture Docs**: Project overview document
- **API Documentation**: Backend API endpoints
- **Component Library**: Frontend component docs

---

*Last Updated: February 2026*
