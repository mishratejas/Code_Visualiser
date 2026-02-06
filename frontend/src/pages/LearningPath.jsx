import React, { useState, useEffect } from 'react';
import {
    Card, Row, Col, Typography, Progress, List, Tag,
    Timeline, Button, Space, Divider, Alert, Select,
    Statistic, Steps, Badge, Collapse, Radio, Tabs
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
    CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import aiService from '../services/ai.js';
import problemService from '../services/problems.js';

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
            // Fetch skill gap analysis
            const skillGapRes = await aiService.getSkillGap();
            
            // Fetch recommendations
            const recRes = await aiService.getRecommendations(20);
            
            // Mock learning path data (in production, this would come from AI service)
            const mockPath = {
                userLevel: 'Intermediate',
                targetLevel: 'Advanced',
                weeksRequired: 8,
                currentWeek: 3,
                milestones: [
                    {
                        id: 1,
                        title: 'Master Arrays & Strings',
                        description: 'Complete all array and string manipulation problems',
                        status: 'completed',
                        problems: 15,
                        completed: 15,
                        topics: ['array', 'string', 'two-pointer']
                    },
                    {
                        id: 2,
                        title: 'Learn Dynamic Programming',
                        description: 'Understand DP patterns and solve 20+ DP problems',
                        status: 'in-progress',
                        problems: 25,
                        completed: 12,
                        topics: ['dynamic-programming', 'memoization', 'tabulation']
                    },
                    {
                        id: 3,
                        title: 'Graph Algorithms',
                        description: 'Master BFS, DFS, and shortest path algorithms',
                        status: 'pending',
                        problems: 20,
                        completed: 0,
                        topics: ['graph', 'bfs', 'dfs', 'dijkstra']
                    },
                    {
                        id: 4,
                        title: 'System Design Basics',
                        description: 'Learn basic system design principles',
                        status: 'pending',
                        problems: 10,
                        completed: 0,
                        topics: ['system-design', 'scalability']
                    }
                ],
                weeklyPlan: [
                    {
                        week: 1,
                        focus: 'Arrays & Strings',
                        topics: ['two-pointer', 'sliding-window', 'hash-map'],
                        problems: 15
                    },
                    {
                        week: 2,
                        focus: 'Linked Lists & Trees',
                        topics: ['linked-list', 'binary-tree', 'bst'],
                        problems: 18
                    },
                    {
                        week: 3,
                        focus: 'Dynamic Programming I',
                        topics: ['fibonacci', 'knapsack', 'lcs'],
                        problems: 12
                    },
                    {
                        week: 4,
                        focus: 'Dynamic Programming II',
                        topics: ['matrix-dp', 'interval-dp', 'bitmask-dp'],
                        problems: 13
                    }
                ],
                skillGap: skillGapRes.data || {},
                recommendations: recRes.data?.recommendations || []
            };

            setLearningPath(mockPath);
        } catch (error) {
            console.error('Failed to fetch learning path:', error);
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
                        value={user?.stats?.streakDays || 0}
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

    const renderPracticeProblems = () => (
        <Card title="Recommended Practice" style={{ marginTop: 16 }}>
            <Tabs defaultActiveKey="today">
                <TabPane tab="Today's Practice" key="today">
                    <List
                        dataSource={learningPath?.recommendations?.slice(0, 5)}
                        renderItem={(problem, index) => (
                            <List.Item
                                actions={[
                                    <Button 
                                        type="link"
                                        onClick={() => window.location.href = `/problem/${problem.problem_id}`}
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
                                                Score: {Math.round(problem.score * 100)}% match
                                            </Text>
                                            <div>
                                                {problem.reasons?.slice(0, 2).map((reason, idx) => (
                                                    <Tag key={idx} color="blue" style={{ marginRight: 4 }}>
                                                        {reason}
                                                    </Tag>
                                                ))}
                                            </div>
                                            <Progress 
                                                percent={Math.round(problem.score * 100)} 
                                                size="small" 
                                                showInfo={false}
                                            />
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </TabPane>
                <TabPane tab="Weakness Focus" key="weakness">
                    <Alert
                        message="Practice problems targeting your weak areas"
                        description="These problems are selected based on your skill gap analysis"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    <List
                        dataSource={learningPath?.recommendations?.slice(5, 10)}
                        renderItem={(problem, index) => (
                            <List.Item
                                actions={[
                                    <Button type="link">Solve</Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={problem.title}
                                    description={`Focus area: ${problem.reasons?.[0] || 'General practice'}`}
                                />
                                <Tag color="red">Weakness Focus</Tag>
                            </List.Item>
                        )}
                    />
                </TabPane>
            </Tabs>
        </Card>
    );

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
                                title="Hours Spent"
                                value={Math.round((user?.stats?.totalRuntime || 0) / 3600000)}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Consistency Score"
                                value={85}
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