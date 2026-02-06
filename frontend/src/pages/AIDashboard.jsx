import React, { useState, useEffect } from 'react';
import { 
    Card, Row, Col, Statistic, Progress, List, Tag, 
    Tabs, Alert, Button, Typography, Space, Divider, 
    Table, Tooltip, Badge, Collapse, Select
} from 'antd';
import {
    DashboardOutlined,
    RocketOutlined,
    BarChartOutlined,
    TrophyOutlined,
    CodeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    StarOutlined,
    FireOutlined,
    TeamOutlined,
    BulbOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import aiService from '../services/ai.js';
import submissionService from '../services/submissions.js';
import CodeAnalysisPanel from '../components/ai/CodeAnalysisPanel.jsx';
import RecommendationsPanel from '../components/ai/RecommendationsPanel.jsx';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

const AIDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        stats: {},
        recentSubmissions: [],
        skillGap: null,
        recommendations: []
    });
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch multiple data sources in parallel
            const [statsRes, submissionsRes, skillGapRes, recRes] = await Promise.all([
                submissionService.getStats(),
                submissionService.getRecentSubmissions(5),
                aiService.getSkillGap(),
                aiService.getRecommendations(6)
            ]);

            setDashboardData({
                stats: statsRes.data || {},
                recentSubmissions: submissionsRes.data?.submissions || [],
                skillGap: skillGapRes.data || null,
                recommendations: recRes.data?.recommendations || []
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
        setLoading(false);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'green';
            case 'medium': return 'orange';
            case 'hard': return 'red';
            default: return 'blue';
        }
    };

    const getQualityColor = (score) => {
        if (score >= 0.8) return '#52c41a';
        if (score >= 0.6) return '#1890ff';
        if (score >= 0.4) return '#faad14';
        return '#ff4d4f';
    };

    const getComplexityColor = (complexity) => {
        const colors = {
            'O(1)': 'green',
            'O(log n)': 'lime',
            'O(n)': 'blue',
            'O(n log n)': 'orange',
            'O(n²)': 'volcano',
            'O(n³)': 'red',
            'O(2^n)': 'magenta'
        };
        return colors[complexity] || 'default';
    };

    const renderStatsCards = () => (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Total Problems Solved"
                        value={dashboardData.stats.totalProblemsSolved || 0}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                    />
                    <Progress
                        percent={dashboardData.stats.totalProblemsSolved || 0}
                        size="small"
                        showInfo={false}
                        strokeColor="#52c41a"
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Acceptance Rate"
                        value={dashboardData.stats.acceptanceRate || 0}
                        suffix="%"
                        prefix={<BarChartOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                    <Progress
                        percent={dashboardData.stats.acceptanceRate || 0}
                        size="small"
                        showInfo={false}
                        strokeColor="#1890ff"
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Average Runtime"
                        value={dashboardData.stats.avgRuntime || 0}
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                    />
                    <Text type="secondary">Lower is better</Text>
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Streak Days"
                        value={dashboardData.stats.streakDays || 0}
                        prefix={<FireOutlined />}
                        valueStyle={{ color: '#cf1322' }}
                    />
                    <Text type="secondary">Keep it up!</Text>
                </Card>
            </Col>
        </Row>
    );

    const renderSkillGapAnalysis = () => {
        if (!dashboardData.skillGap) return null;

        const { difficulty_analysis, topic_analysis, weaknesses, strengths } = dashboardData.skillGap;

        return (
            <Card 
                title={
                    <Space>
                        <LineChartOutlined />
                        <span>Skill Gap Analysis</span>
                    </Space>
                }
                style={{ marginTop: 16 }}
            >
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Title level={5}>Difficulty Performance</Title>
                        <Row gutter={[16, 16]}>
                            {Object.entries(difficulty_analysis || {}).map(([diff, stats]) => (
                                <Col key={diff} xs={24} sm={8}>
                                    <Card size="small">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Text strong style={{ textTransform: 'capitalize' }}>
                                                {diff}
                                            </Text>
                                            <Progress
                                                percent={stats.successRate || 0}
                                                status={stats.successRate >= 70 ? "success" : 
                                                       stats.successRate >= 50 ? "normal" : "exception"}
                                            />
                                            <Text type="secondary">
                                                {stats.solved || 0}/{stats.total || 0} solved
                                            </Text>
                                            <Text type="secondary">
                                                Avg: {stats.avgTime || 0}ms
                                            </Text>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Col>

                    {weaknesses.length > 0 && (
                        <Col span={24}>
                            <Alert
                                message="Areas for Improvement"
                                description={
                                    <List
                                        size="small"
                                        dataSource={weaknesses}
                                        renderItem={(item, index) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={
                                                        <Space>
                                                            <WarningOutlined style={{ color: '#ff4d4f' }} />
                                                            <Text strong>{item.topic}</Text>
                                                        </Space>
                                                    }
                                                    description={
                                                        <div>
                                                            <Text>Success Rate: {item.success_rate.toFixed(1)}%</Text>
                                                            <br />
                                                            <Text type="secondary">{item.suggestion}</Text>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                }
                                type="warning"
                                showIcon
                            />
                        </Col>
                    )}

                    {strengths.length > 0 && (
                        <Col span={24}>
                            <Alert
                                message="Your Strengths"
                                description={
                                    <List
                                        size="small"
                                        dataSource={strengths}
                                        renderItem={(item, index) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={
                                                        <Space>
                                                            <StarOutlined style={{ color: '#52c41a' }} />
                                                            <Text strong>{item.topic}</Text>
                                                        </Space>
                                                    }
                                                    description={`Success Rate: ${item.success_rate.toFixed(1)}%`}
                                                />
                                            </List.Item>
                                        )}
                                />
                                }
                                type="success"
                                showIcon
                            />
                        </Col>
                    )}

                    <Col span={24}>
                        <Title level={5}>Topic Performance</Title>
                        <Row gutter={[8, 8]}>
                            {topic_analysis?.slice(0, 10).map((topic, index) => (
                                <Col key={index}>
                                    <Tooltip title={`${topic.success_rate.toFixed(1)}% success rate`}>
                                        <Tag
                                            color={topic.success_rate >= 70 ? "green" : 
                                                  topic.success_rate >= 50 ? "blue" : "red"}
                                            style={{ padding: '4px 8px', fontSize: '14px' }}
                                        >
                                            {topic.topic}: {topic.solved}/{topic.total_attempts}
                                        </Tag>
                                    </Tooltip>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderRecentSubmissions = () => (
        <Card 
            title={
                <Space>
                    <CodeOutlined />
                    <span>Recent Submissions</span>
                </Space>
            }
            style={{ marginTop: 16 }}
            extra={
                <Button 
                    type="link" 
                    onClick={() => window.location.href = '/submissions'}
                >
                    View All
                </Button>
            }
        >
            <Table
                dataSource={dashboardData.recentSubmissions}
                rowKey="_id"
                pagination={false}
                size="small"
                onRow={(record) => ({
                    onClick: () => setSelectedSubmission(record)
                })}
                columns={[
                    {
                        title: 'Problem',
                        dataIndex: 'problem',
                        key: 'problem',
                        render: (problem) => problem?.title || 'Unknown',
                        ellipsis: true
                    },
                    {
                        title: 'Difficulty',
                        dataIndex: 'problem',
                        key: 'difficulty',
                        render: (problem) => (
                            <Tag color={getDifficultyColor(problem?.difficulty)}>
                                {problem?.difficulty || 'Medium'}
                            </Tag>
                        )
                    },
                    {
                        title: 'Verdict',
                        dataIndex: 'verdict',
                        key: 'verdict',
                        render: (verdict) => (
                            <Badge
                                status={verdict === 'accepted' ? 'success' : 'error'}
                                text={
                                    <span style={{
                                        color: verdict === 'accepted' ? '#52c41a' : '#ff4d4f'
                                    }}>
                                        {verdict === 'accepted' ? 'Accepted' : 'Failed'}
                                    </span>
                                }
                            />
                        )
                    },
                    {
                        title: 'Runtime',
                        dataIndex: 'runtime',
                        key: 'runtime',
                        render: (runtime) => `${runtime || 0} ms`
                    },
                    {
                        title: 'Language',
                        dataIndex: 'language',
                        key: 'language',
                        render: (lang) => (
                            <Tag color="blue">{lang?.toUpperCase() || 'Unknown'}</Tag>
                        )
                    }
                ]}
            />
        </Card>
    );

    const renderRecommendations = () => {
        if (!dashboardData.recommendations || dashboardData.recommendations.length === 0) {
            return null;
        }

        return (
            <RecommendationsPanel 
                recommendations={dashboardData.recommendations}
                title="Personalized Recommendations"
                showViewAll={true}
            />
        );
    };

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <Card>
                    <Row align="middle" justify="space-between">
                        <Col>
                            <Space direction="vertical" size="small">
                                <Title level={2}>
                                    <DashboardOutlined /> AI Dashboard
                                </Title>
                                <Text type="secondary">
                                    Personalized insights and recommendations powered by AI
                                </Text>
                            </Space>
                        </Col>
                        <Col>
                            <Button 
                                type="primary" 
                                icon={<RocketOutlined />}
                                onClick={() => window.location.href = '/interview'}
                            >
                                Start AI Interview
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Stats Cards */}
                {renderStatsCards()}

                {/* Main Content Tabs */}
                <Tabs defaultActiveKey="overview">
                    <TabPane tab="Overview" key="overview">
                        {renderSkillGapAnalysis()}
                        {renderRecentSubmissions()}
                        {renderRecommendations()}
                    </TabPane>

                    <TabPane tab="Learning Path" key="learning">
                        <LearningPathContent />
                    </TabPane>

                    <TabPane tab="AI Analysis" key="analysis">
                        {selectedSubmission ? (
                            <div style={{ marginTop: 16 }}>
                                <Button 
                                    type="link" 
                                    onClick={() => setSelectedSubmission(null)}
                                    style={{ marginBottom: 16 }}
                                >
                                    ← Back to list
                                </Button>
                                <CodeAnalysisPanel 
                                    submissionId={selectedSubmission._id}
                                    submission={selectedSubmission}
                                />
                            </div>
                        ) : (
                            <Alert
                                message="Select a submission to view AI analysis"
                                description="Click on any submission in the table above to see detailed AI-powered analysis."
                                type="info"
                                showIcon
                            />
                        )}
                    </TabPane>
                </Tabs>
            </Space>
        </div>
    );
};

// Learning Path Content Component
const LearningPathContent = () => {
    const [learningPath, setLearningPath] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLearningPath();
    }, []);

    const fetchLearningPath = async () => {
        setLoading(true);
        try {
            // This would be replaced with actual API call
            const mockPath = {
                currentLevel: 'Intermediate',
                nextLevel: 'Advanced',
                progress: 65,
                milestones: [
                    { id: 1, title: 'Master Arrays & Strings', completed: true, priority: 'high' },
                    { id: 2, title: 'Learn Dynamic Programming', completed: false, priority: 'high' },
                    { id: 3, title: 'Practice Graph Algorithms', completed: false, priority: 'medium' },
                    { id: 4, title: 'System Design Basics', completed: false, priority: 'low' }
                ],
                recommendedProblems: [
                    { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', relevance: 95 },
                    { id: 'longest-substring', title: 'Longest Substring', difficulty: 'Medium', relevance: 88 },
                    { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', relevance: 92 }
                ]
            };
            setLearningPath(mockPath);
        } catch (error) {
            console.error('Failed to fetch learning path:', error);
        }
        setLoading(false);
    };

    if (!learningPath) {
        return <Alert message="Learning path data not available" type="info" showIcon />;
    }

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Card title="Your Learning Journey">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text strong>Current Level: </Text>
                            <Tag color="blue">{learningPath.currentLevel}</Tag>
                        </div>
                        <div>
                            <Text strong>Progress to Next Level: </Text>
                            <Progress 
                                percent={learningPath.progress} 
                                status="active" 
                                style={{ width: '60%' }}
                            />
                        </div>
                    </Space>
                </Card>
            </Col>

            <Col span={24}>
                <Card title="Upcoming Milestones">
                    <List
                        dataSource={learningPath.milestones}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        item.completed ? 
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                                        <ClockCircleOutlined />
                                    }
                                    title={item.title}
                                    description={
                                        <Tag color={
                                            item.priority === 'high' ? 'red' : 
                                            item.priority === 'medium' ? 'orange' : 'blue'
                                        }>
                                            {item.priority} priority
                                        </Tag>
                                    }
                                />
                                {!item.completed && (
                                    <Button type="link" size="small">
                                        Start Learning
                                    </Button>
                                )}
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>

            <Col span={24}>
                <Card title="Recommended Practice Problems">
                    <List
                        dataSource={learningPath.recommendedProblems}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    <Button 
                                        type="link" 
                                        onClick={() => window.location.href = `/problem/${item.id}`}
                                    >
                                        Solve
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={
                                        <Space>
                                            <Text strong>{item.title}</Text>
                                            <Tag color={getDifficultyColor(item.difficulty)}>
                                                {item.difficulty}
                                            </Tag>
                                        </Space>
                                    }
                                    description={
                                        <Space>
                                            <Text type="secondary">Relevance: {item.relevance}%</Text>
                                            <Progress 
                                                percent={item.relevance} 
                                                size="small" 
                                                showInfo={false}
                                                style={{ width: '100px' }}
                                            />
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default AIDashboard;