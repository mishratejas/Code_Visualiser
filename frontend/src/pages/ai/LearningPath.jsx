import React, { useState, useEffect } from 'react';
import {
    Card, Row, Col, Typography, Progress, List, Tag,
    Timeline, Button, Space, Divider, Alert, Select,
    Statistic, Steps, Badge, Collapse, Radio, Tabs, message
} from 'antd';
import {
    RocketOutlined,
    BookOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
    FireOutlined,
    StarOutlined,
    TeamOutlined,
    LineChartOutlined,
    DashboardOutlined,
    CalendarOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext.jsx';
import { aiApi, problemsApi } from '../../services/api.js';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TabPane } = Tabs;

const LearningPath = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [learningPath, setLearningPath] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [progress, setProgress] = useState({
        overall: 45,
        easy: 80,
        medium: 60,
        hard: 25
    });

    useEffect(() => {
        fetchLearningPath();
    }, []);

    const fetchLearningPath = async () => {
        setLoading(true);
        try {
            const userStats = user?.stats || {};

            // Real problem pool with per-user solved/attempted status attached server-side
            const problemsRes = await problemsApi.getAll({ limit: 50, sort: '-createdAt' });
            const problems = problemsRes?.data?.problems || [];

            const availableProblems = problems.map(p => ({
                _id: p._id,
                title: p.title,
                slug: p.slug,
                difficulty: p.difficulty,
                tags: p.tags || [],
                acceptanceRate: p.metadata?.acceptanceRate ?? 50,
            }));
            const solvedProblems = availableProblems.filter(
                (p, i) => problems[i].userStatus === 'solved'
            );

            // Real AI-generated roadmap (Gemini, falls back to rule-based phases if unavailable)
            const pathRes = await aiApi.getLearningPath({
                user_stats: userStats,
                target_role: 'sde',
            });
            const path = pathRes?.data || {};

            // Real personalised problem recommendations
            const recRes = await aiApi.getRecommendations({
                user_stats: userStats,
                solved_problems: solvedProblems,
                available_problems: availableProblems,
                limit: 20,
            });
            const recommendations = recRes?.data || [];

            // Weak topics computed from the user's own attempted-vs-solved ratio —
            // real data, not a fabricated "skill gap" endpoint.
            const tagTotals = {};
            problems.forEach(p => {
                if (p.userStatus === 'solved' || p.userStatus === 'attempted') {
                    (p.tags || []).forEach(tag => {
                        tagTotals[tag] = tagTotals[tag] || { attempted: 0, solved: 0 };
                        tagTotals[tag].attempted += 1;
                        if (p.userStatus === 'solved') tagTotals[tag].solved += 1;
                    });
                }
            });
            const weaknesses = Object.entries(tagTotals)
                .filter(([, v]) => v.attempted >= 1)
                .map(([topic, v]) => ({
                    topic,
                    success_rate: (v.solved / v.attempted) * 100,
                    suggestion: `You've solved ${v.solved}/${v.attempted} attempted ${topic} problems — keep practicing this topic.`,
                }))
                .filter(w => w.success_rate < 70)
                .sort((a, b) => a.success_rate - b.success_rate)
                .slice(0, 5);

            // Turn the AI service's phase list into the milestone/timeline shape the UI renders.
            // "completed" is estimated from how many of the user's solved problems match each
            // phase's focus topics — a real (if approximate) signal, not a placeholder number.
            const phases = path.phases || [];
            let currentPhaseFound = false;
            const milestones = phases.map((phase, idx) => {
                const topics = phase.focus_topics || [];
                const completed = solvedProblems.filter(p =>
                    p.tags?.some(t => topics.includes(t))
                ).length;
                const target = phase.target_problems || 1;
                let status = 'pending';
                if (completed >= target) status = 'completed';
                else if (!currentPhaseFound) { status = 'in-progress'; currentPhaseFound = true; }
                return {
                    id: phase.phase ?? idx + 1,
                    title: phase.title,
                    description: phase.description,
                    status,
                    problems: target,
                    completed: Math.min(completed, target),
                    topics,
                };
            });

            // Flatten phases into a week-by-week plan using each phase's duration_weeks
            const weeklyPlan = [];
            let weekCounter = 1;
            phases.forEach(phase => {
                const weeks = phase.duration_weeks || 1;
                const problemsPerWeek = Math.ceil((phase.target_problems || 0) / weeks);
                for (let w = 0; w < weeks; w++) {
                    weeklyPlan.push({
                        week: weekCounter++,
                        focus: phase.title,
                        topics: phase.focus_topics || [],
                        problems: problemsPerWeek,
                    });
                }
            });
            const currentWeek = milestones.findIndex(m => m.status === 'in-progress');

            setLearningPath({
                userLevel: path.current_level
                    ? path.current_level[0].toUpperCase() + path.current_level.slice(1)
                    : 'Intermediate',
                targetLevel: 'Advanced',
                weeksRequired: path.estimated_weeks || weeklyPlan.length || 8,
                currentWeek: currentWeek >= 0 ? currentWeek : milestones.length,
                dailyGoal: path.daily_goal,
                resources: path.resources || [],
                milestones,
                weeklyPlan,
                skillGap: { weaknesses },
                recommendations,
            });

            // Real progress bars from actual solved counts vs. total problems by difficulty
            const [easyTotal, mediumTotal, hardTotal] = await Promise.all(
                ['easy', 'medium', 'hard'].map(d =>
                    problemsApi.getAll({ difficulty: d, limit: 1 })
                        .then(r => r?.data?.pagination?.total || 0)
                        .catch(() => 0)
                )
            );
            const pct = (solved, total) => (total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0);
            const easyPct = pct(userStats.easySolved || 0, easyTotal);
            const mediumPct = pct(userStats.mediumSolved || 0, mediumTotal);
            const hardPct = pct(userStats.hardSolved || 0, hardTotal);
            const denom = easyTotal + mediumTotal + hardTotal;
            const overallPct = pct(
                (userStats.easySolved || 0) + (userStats.mediumSolved || 0) + (userStats.hardSolved || 0),
                denom
            );
            setProgress({ overall: overallPct, easy: easyPct, medium: mediumPct, hard: hardPct });
        } catch (error) {
            console.error('Failed to fetch learning path:', error);
            message.error('Could not load your learning path. Please try again shortly.');
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'green';
            case 'in-progress': return 'blue';
            case 'pending': return 'gray';
            default: return 'default';
        }
    };

    const renderHeader = () => (
        <Card>
            <Row justify="space-between" align="middle">
                <Col>
                    <Space direction="vertical" size="small">
                        <Title level={2}>
                            <BookOutlined /> Personalized Learning Path
                        </Title>
                        <Text type="secondary">
                            AI-generated roadmap to master Data Structures & Algorithms
                        </Text>
                    </Space>
                </Col>
                <Col>
                    <Space>
                        <Statistic
                            title="Current Level"
                            value={learningPath?.userLevel || 'Beginner'}
                            prefix={<TrophyOutlined />}
                        />
                        <Statistic
                            title="Target Level"
                            value={learningPath?.targetLevel || 'Advanced'}
                            prefix={<RocketOutlined />}
                        />
                    </Space>
                </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Text strong>Overall Progress: </Text>
                    <Progress 
                        percent={progress.overall} 
                        status="active" 
                        style={{ width: '60%' }}
                    />
                </Col>
                <Col span={6}>
                    <Progress 
                        type="circle" 
                        percent={progress.easy} 
                        width={80}
                        format={() => 'Easy'}
                    />
                </Col>
                <Col span={6}>
                    <Progress 
                        type="circle" 
                        percent={progress.medium} 
                        width={80}
                        format={() => 'Medium'}
                    />
                </Col>
                <Col span={6}>
                    <Progress 
                        type="circle" 
                        percent={progress.hard} 
                        width={80}
                        format={() => 'Hard'}
                    />
                </Col>
                <Col span={6}>
                    <Statistic
                        title="Days Streak"
                        value={user?.stats?.streak || 0}
                        prefix={<FireOutlined />}
                    />
                </Col>
            </Row>
        </Card>
    );

    const renderMilestones = () => (
        <Card 
            title="Learning Milestones"
            style={{ marginTop: 16 }}
            extra={
                <Select 
                    defaultValue="all" 
                    style={{ width: 120 }}
                    onChange={value => setSelectedTopic(value)}
                >
                    <Option value="all">All Topics</Option>
                    <Option value="array">Arrays</Option>
                    <Option value="dp">Dynamic Programming</Option>
                    <Option value="graph">Graph</Option>
                    <Option value="tree">Trees</Option>
                </Select>
            }
        >
            <Timeline mode="alternate">
                {learningPath?.milestones?.map(milestone => (
                    <Timeline.Item
                        key={milestone.id}
                        color={getStatusColor(milestone.status)}
                        label={
                            <Space>
                                <Text strong>{milestone.completed}/{milestone.problems}</Text>
                                <Text type="secondary">problems</Text>
                            </Space>
                        }
                    >
                        <Card size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Title level={5}>{milestone.title}</Title>
                                    </Col>
                                    <Col>
                                        <Tag color={getStatusColor(milestone.status)}>
                                            {milestone.status.replace('-', ' ').toUpperCase()}
                                        </Tag>
                                    </Col>
                                </Row>
                                <Text type="secondary">{milestone.description}</Text>
                                
                                <div style={{ marginTop: 8 }}>
                                    {milestone.topics?.map((topic, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                                            {topic}
                                        </Tag>
                                    ))}
                                </div>
                                
                                <Progress 
                                    percent={Math.round((milestone.completed / milestone.problems) * 100)} 
                                    size="small"
                                />
                                
                                {milestone.status === 'in-progress' && (
                                    <Button 
                                        type="primary" 
                                        size="small"
                                        onClick={() => startMilestone(milestone.id)}
                                    >
                                        Continue Learning
                                    </Button>
                                )}
                            </Space>
                        </Card>
                    </Timeline.Item>
                ))}
            </Timeline>
        </Card>
    );

    const renderWeeklyPlan = () => (
        <Card title="Weekly Plan" style={{ marginTop: 16 }}>
            <Steps direction="vertical" current={learningPath?.currentWeek || 0}>
                {learningPath?.weeklyPlan?.map((week, index) => (
                    <Step
                        key={index}
                        title={`Week ${week.week}: ${week.focus}`}
                        description={
                            <Space direction="vertical" size="small">
                                <div>
                                    {week.topics?.map((topic, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginRight: 4 }}>
                                            {topic}
                                        </Tag>
                                    ))}
                                </div>
                                <Text type="secondary">{week.problems} problems</Text>
                                {index < (learningPath?.currentWeek || 0) && (
                                    <Button type="link" size="small">
                                        View Completed Problems
                                    </Button>
                                )}
                                {index === (learningPath?.currentWeek || 0) && (
                                    <Button type="primary" size="small">
                                        Start This Week
                                    </Button>
                                )}
                            </Space>
                        }
                    />
                ))}
            </Steps>
        </Card>
    );

    const renderTopicRecommendations = () => {
        if (!learningPath?.skillGap?.weaknesses) {
            return null;
        }

        return (
            <Card title="Focus Areas" style={{ marginTop: 16 }}>
                <List
                    dataSource={learningPath.skillGap.weaknesses}
                    renderItem={(weakness, index) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<WarningOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />}
                                title={weakness.topic}
                                description={
                                    <Space direction="vertical" size="small">
                                        <Text>Success Rate: {weakness.success_rate.toFixed(1)}%</Text>
                                        <Text type="secondary">{weakness.suggestion}</Text>
                                        <Button type="link" size="small">
                                            Practice {weakness.topic} Problems
                                        </Button>
                                    </Space>
                                }
                            />
                            <Progress 
                                type="circle" 
                                percent={weakness.success_rate} 
                                width={60}
                                status={weakness.success_rate < 50 ? "exception" : "normal"}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        );
    };

    const priorityToPercent = (priority) => (
        priority === 'high' ? 90 : priority === 'medium' ? 60 : 30
    );

    const renderPracticeProblems = () => {
        const weakTopics = new Set((learningPath?.skillGap?.weaknesses || []).map(w => w.topic));
        const recommendations = learningPath?.recommendations || [];
        const weaknessFocused = recommendations.filter(p => p.tags?.some(t => weakTopics.has(t)));

        return (
        <Card title="Recommended Practice" style={{ marginTop: 16 }}>
            <Tabs defaultActiveKey="today">
                <TabPane tab="Today's Practice" key="today">
                    <List
                        dataSource={recommendations.slice(0, 5)}
                        renderItem={(problem, index) => {
                            const percent = priorityToPercent(problem.priority);
                            return (
                            <List.Item
                                actions={[
                                    <Button 
                                        type="link"
                                        onClick={() => window.location.href = `/problem/${problem.slug || problem._id}`}
                                    >
                                        Solve
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Badge count={index + 1}>
                                            <div style={{ width: 32 }} />
                                        </Badge>
                                    }
                                    title={
                                        <Space>
                                            <Text strong>{problem.title}</Text>
                                            <Tag color={
                                                problem.difficulty === 'easy' ? 'green' :
                                                problem.difficulty === 'medium' ? 'orange' : 'red'
                                            }>
                                                {problem.difficulty}
                                            </Tag>
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size="small">
                                            <Text type="secondary">
                                                {problem.priority ? `${problem.priority} priority` : ''} match
                                            </Text>
                                            {problem.recommendation_reason && (
                                                <Tag color="blue">{problem.recommendation_reason}</Tag>
                                            )}
                                            <Progress 
                                                percent={percent} 
                                                size="small" 
                                                showInfo={false}
                                            />
                                        </Space>
                                    }
                                />
                            </List.Item>
                        );}}
                    />
                </TabPane>
                <TabPane tab="Weakness Focus" key="weakness">
                    <Alert
                        message="Practice problems targeting your weak areas"
                        description="These problems are selected based on topics where your solve rate is lowest"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    <List
                        dataSource={weaknessFocused.slice(0, 5)}
                        locale={{ emptyText: 'No weak-topic matches yet — solve a few more problems for this to populate.' }}
                        renderItem={(problem, index) => (
                            <List.Item
                                actions={[
                                    <Button 
                                        type="link"
                                        onClick={() => window.location.href = `/problem/${problem.slug || problem._id}`}
                                    >
                                        Solve
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={problem.title}
                                    description={`Focus area: ${problem.recommendation_reason || 'General practice'}`}
                                />
                                <Tag color="red">Weakness Focus</Tag>
                            </List.Item>
                        )}
                    />
                </TabPane>
            </Tabs>
        </Card>
        );
    };

    const startMilestone = (milestoneId) => {
        // Navigate to problems for this milestone
        message.info(`Starting milestone ${milestoneId}`);
        // In production, this would navigate to filtered problems
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Title level={3}>Generating your personalized learning path...</Title>
                <Text type="secondary">AI is analyzing your performance to create the optimal roadmap</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {renderHeader()}
                
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        {renderMilestones()}
                        {renderTopicRecommendations()}
                    </Col>
                    <Col xs={24} lg={8}>
                        {renderWeeklyPlan()}
                        {renderPracticeProblems()}
                    </Col>
                </Row>

                <Card title="Learning Statistics" style={{ marginTop: 16 }}>
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Statistic
                                title="Total Problems Solved"
                                value={user?.stats?.totalProblemsSolved || 0}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Longest Streak"
                                value={user?.stats?.maxStreak || 0}
                                suffix="days"
                                prefix={<ClockCircleOutlined />}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Acceptance Rate"
                                value={
                                    user?.stats?.totalSubmissions
                                        ? Math.round((user.stats.acceptedSubmissions / user.stats.totalSubmissions) * 100)
                                        : 0
                                }
                                suffix="%"
                                prefix={<LineChartOutlined />}
                            />
                        </Col>
                    </Row>
                </Card>
            </Space>
        </div>
    );
};

export default LearningPath;