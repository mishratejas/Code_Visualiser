import React, { useState, useEffect } from 'react';
import { 
    Card, Row, Col, Progress, Tag, List, Alert, 
    Typography, Space, Divider, Button, Collapse, 
    Tooltip, Statistic, Tabs, Timeline, Badge 
} from 'antd';
import { 
    CheckCircleOutlined, 
    WarningOutlined, 
    ClockCircleOutlined,
    CodeOutlined,
    BulbOutlined,
    LineChartOutlined,
    RocketOutlined,
    EyeOutlined,
    FileTextOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import aiService from '../../services/ai.js';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const CodeAnalysisPanel = ({ submissionId, submission, showFull = false }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(submission?.aiAnalysis || null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!analysis && submissionId) {
            fetchAnalysis();
        }
    }, [submissionId]);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const response = await aiService.analyzeSubmission(submissionId);
            setAnalysis(response.data.analysis);
        } catch (error) {
            console.error('Failed to fetch AI analysis:', error);
        }
        setLoading(false);
    };

    if (!analysis) {
        return (
            <Card loading={loading} style={{ marginTop: 16 }}>
                <Alert
                    message="AI Analysis Unavailable"
                    description="AI service is currently unavailable. Please try again later."
                    type="warning"
                    showIcon
                />
            </Card>
        );
    }

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

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'red';
            case 'medium': return 'orange';
            case 'low': return 'blue';
            default: return 'default';
        }
    };

    const renderOverview = () => (
        <Row gutter={[16, 16]}>
            {/* Quality Score */}
            <Col span={24}>
                <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>
                                <CheckCircleOutlined style={{ marginRight: 8 }} />
                                Code Quality Score
                            </Text>
                            <Badge 
                                count={analysis.qualityLabel?.toUpperCase()}
                                style={{ 
                                    backgroundColor: getQualityColor(analysis.codeQuality),
                                    color: 'white'
                                }}
                            />
                        </div>
                        <Progress 
                            percent={Math.round(analysis.codeQuality * 100)}
                            strokeColor={getQualityColor(analysis.codeQuality)}
                            status="active"
                        />
                        <Text type="secondary">
                            Confidence: {(analysis.confidence * 100).toFixed(1)}%
                        </Text>
                    </Space>
                </Card>
            </Col>

            {/* Complexity Analysis */}
            <Col span={24}>
                <Card size="small" title="Complexity Analysis">
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Tooltip title="Time Complexity">
                                <Card size="small">
                                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                        <ClockCircleOutlined style={{ fontSize: '24px' }} />
                                        <Tag color={getComplexityColor(analysis.complexity?.time)}>
                                            {analysis.complexity?.time || 'O(n)'}
                                        </Tag>
                                        <Text type="secondary">Time</Text>
                                    </Space>
                                </Card>
                            </Tooltip>
                        </Col>
                        <Col span={12}>
                            <Tooltip title="Space Complexity">
                                <Card size="small">
                                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                        <LineChartOutlined style={{ fontSize: '24px' }} />
                                        <Tag color="cyan">
                                            {analysis.complexity?.space || 'O(1)'}
                                        </Tag>
                                        <Text type="secondary">Space</Text>
                                    </Space>
                                </Card>
                            </Tooltip>
                        </Col>
                    </Row>
                </Card>
            </Col>

            {/* Performance Metrics */}
            <Col span={24}>
                <Card size="small" title="Performance Metrics">
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Statistic
                                title="Cyclomatic Complexity"
                                value={analysis.cyclomaticComplexity || 'N/A'}
                                suffix={analysis.cyclomaticComplexity > 10 ? '⚠️' : ''}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Lines of Code"
                                value={analysis.linesOfCode || 'N/A'}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Function Count"
                                value={analysis.functionCount || 'N/A'}
                            />
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
    );

    const renderIssues = () => {
        if (!analysis.vulnerabilities || analysis.vulnerabilities.length === 0) {
            return (
                <Alert
                    message="No Issues Detected"
                    description="Great job! Your code follows best practices."
                    type="success"
                    showIcon
                />
            );
        }

        return (
            <List
                dataSource={analysis.vulnerabilities}
                renderItem={(issue, index) => (
                    <List.Item>
                        <Alert
                            message={issue.type}
                            description={
                                <Space direction="vertical" size="small">
                                    <Text>{issue.description}</Text>
                                    <div>
                                        <Tag color={getSeverityColor(issue.severity)}>
                                            {issue.severity?.toUpperCase()}
                                        </Tag>
                                        {issue.location && (
                                            <Tag color="blue">Line: {issue.location}</Tag>
                                        )}
                                    </div>
                                </Space>
                            }
                            type={issue.severity === 'high' ? 'error' : 'warning'}
                            showIcon
                            style={{ width: '100%' }}
                        />
                    </List.Item>
                )}
            />
        );
    };

    const renderSuggestions = () => {
        if (!analysis.suggestions || analysis.suggestions.length === 0) {
            return (
                <Alert
                    message="No Suggestions"
                    description="Your code is well-optimized!"
                    type="info"
                    showIcon
                />
            );
        }

        return (
            <Timeline>
                {analysis.suggestions.map((suggestion, index) => (
                    <Timeline.Item
                        key={index}
                        dot={<BulbOutlined style={{ fontSize: '16px' }} />}
                        color="blue"
                    >
                        <Card size="small">
                            <Space direction="vertical" size="small">
                                <Text strong>Suggestion {index + 1}</Text>
                                <Text>{suggestion}</Text>
                                {index === 0 && (
                                    <Button type="link" size="small">
                                        Show Example
                                    </Button>
                                )}
                            </Space>
                        </Card>
                    </Timeline.Item>
                ))}
            </Timeline>
        );
    };

    const renderComparison = () => (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Alert
                    message="Benchmark Comparison"
                    description="Compare your solution with optimal benchmarks"
                    type="info"
                    showIcon
                />
            </Col>
            <Col span={12}>
                <Card size="small" title="Your Solution">
                    <Space direction="vertical">
                        <Text>Time: {analysis.complexity?.time}</Text>
                        <Text>Space: {analysis.complexity?.space}</Text>
                        <Text>Quality: {Math.round(analysis.codeQuality * 100)}%</Text>
                    </Space>
                </Card>
            </Col>
            <Col span={12}>
                <Card size="small" title="Optimal Solution">
                    <Space direction="vertical">
                        <Text>Time: O(n)</Text>
                        <Text>Space: O(1)</Text>
                        <Text>Quality: 90%+</Text>
                    </Space>
                </Card>
            </Col>
            <Col span={24}>
                <Button 
                    type="primary" 
                    icon={<RocketOutlined />}
                    onClick={() => window.location.href = `/learn/optimize/${submissionId}`}
                >
                    Learn Optimization Techniques
                </Button>
            </Col>
        </Row>
    );

    return (
        <Card 
            title={
                <Space>
                    <BulbOutlined />
                    <span>AI Code Analysis</span>
                    {analysis.confidence > 0.7 && (
                        <Tag color="green">High Confidence</Tag>
                    )}
                </Space>
            }
            loading={loading}
            style={{ marginTop: 16 }}
            extra={
                <Space>
                    <Tooltip title="View Detailed Report">
                        <Button 
                            type="link" 
                            icon={<FileTextOutlined />}
                            onClick={() => window.open(`/analysis/${submissionId}`, '_blank')}
                        >
                            Full Report
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Overview" key="overview">
                    {renderOverview()}
                </TabPane>
                <TabPane 
                    tab={
                        <span>
                            <SafetyOutlined />
                            Issues {analysis.vulnerabilities?.length > 0 && 
                                `(${analysis.vulnerabilities.length})`}
                        </span>
                    } 
                    key="issues"
                >
                    {renderIssues()}
                </TabPane>
                <TabPane 
                    tab={
                        <span>
                            <BulbOutlined />
                            Suggestions {analysis.suggestions?.length > 0 && 
                                `(${analysis.suggestions.length})`}
                        </span>
                    } 
                    key="suggestions"
                >
                    {renderSuggestions()}
                </TabPane>
                <TabPane tab="Comparison" key="comparison">
                    {renderComparison()}
                </TabPane>
            </Tabs>

            {analysis.performanceRating && (
                <Divider>
                    <Tag color={
                        analysis.performanceRating === 'optimized' ? 'green' :
                        analysis.performanceRating === 'acceptable' ? 'blue' : 'orange'
                    }>
                        {analysis.performanceRating.toUpperCase()}
                    </Tag>
                </Divider>
            )}

            {analysis.bottleneckAnalysis && analysis.bottleneckAnalysis.length > 0 && (
                <Alert
                    message="Performance Bottlenecks"
                    description={
                        <List
                            size="small"
                            dataSource={analysis.bottleneckAnalysis}
                            renderItem={(item, index) => (
                                <List.Item>
                                    <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                                    {item}
                                </List.Item>
                            )}
                        />
                    }
                    type="warning"
                    showIcon
                />
            )}
        </Card>
    );
};

export default CodeAnalysisPanel;