import React from 'react';
import {
    Card, List, Tag, Typography, Space, Button,
    Progress, Row, Col, Statistic, Tooltip, Badge
} from 'antd';
import {
    RocketOutlined,
    StarOutlined,
    FireOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ArrowRightOutlined,
    BulbOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const RecommendationsPanel = ({ 
    recommendations = [], 
    title = "AI Recommendations",
    showViewAll = false,
    maxItems = 5
}) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <Card title={title}>
                <Paragraph type="secondary">
                    No recommendations available. Complete more problems to get personalized suggestions.
                </Paragraph>
            </Card>
        );
    }

    const displayedRecommendations = recommendations.slice(0, maxItems);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'green';
            case 'medium': return 'orange';
            case 'hard': return 'red';
            default: return 'blue';
        }
    };

    const getRelevanceColor = (score) => {
        if (score >= 0.8) return '#52c41a';
        if (score >= 0.6) return '#1890ff';
        return '#faad14';
    };

    return (
        <Card 
            title={
                <Space>
                    <BulbOutlined />
                    <span>{title}</span>
                    <Badge 
                        count={recommendations.length}
                        style={{ backgroundColor: '#52c41a' }}
                    />
                </Space>
            }
            extra={
                showViewAll && (
                    <Button 
                        type="link" 
                        onClick={() => window.location.href = '/recommendations'}
                    >
                        View All <ArrowRightOutlined />
                    </Button>
                )
            }
        >
            <List
                dataSource={displayedRecommendations}
                renderItem={(problem, index) => (
                    <List.Item
                        actions={[
                            <Button 
                                type="primary" 
                                size="small"
                                onClick={() => window.location.href = `/problem/${problem.problem_id}`}
                            >
                                Solve
                            </Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                    <Badge 
                                        count={index + 1}
                                        style={{ 
                                            backgroundColor: getRelevanceColor(problem.score),
                                            color: 'white'
                                        }}
                                    />
                                    <div style={{ marginTop: '4px' }}>
                                        <Tag color={getDifficultyColor(problem.difficulty)}>
                                            {problem.difficulty?.charAt(0).toUpperCase()}
                                        </Tag>
                                    </div>
                                </div>
                            }
                            title={
                                <Space direction="vertical" size="small">
                                    <Text strong>{problem.title}</Text>
                                    <div>
                                        {problem.reasons?.slice(0, 2).map((reason, idx) => (
                                            <Tooltip key={idx} title={reason}>
                                                <Tag 
                                                    color="blue" 
                                                    style={{ marginRight: 4, cursor: 'pointer' }}
                                                >
                                                    {reason.substring(0, 20)}...
                                                </Tag>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </Space>
                            }
                            description={
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <Progress 
                                        percent={Math.round(problem.score * 100)}
                                        size="small"
                                        strokeColor={getRelevanceColor(problem.score)}
                                        showInfo={false}
                                    />
                                    <Row gutter={[8, 8]}>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                <StarOutlined /> Match: {Math.round(problem.score * 100)}%
                                            </Text>
                                        </Col>
                                        {problem.predicted_success_rate && (
                                            <Col span={12}>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    <CheckCircleOutlined /> Success: {Math.round(problem.predicted_success_rate * 100)}%
                                                </Text>
                                            </Col>
                                        )}
                                    </Row>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />

            {/* Summary Statistics */}
            <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Statistic
                            title="Avg. Relevance"
                            value={Math.round(
                                recommendations.reduce((sum, p) => sum + p.score, 0) / 
                                recommendations.length * 100
                            )}
                            suffix="%"
                            prefix={<RocketOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Easy Problems"
                            value={recommendations.filter(p => p.difficulty === 'easy').length}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Hours Saved"
                            value={Math.round(recommendations.length * 1.5)}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Col>
                </Row>
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button 
                    type="dashed" 
                    icon={<FireOutlined />}
                    onClick={() => window.location.href = '/learning-path'}
                >
                    View Personalized Learning Path
                </Button>
            </div>
        </Card>
    );
};

export default RecommendationsPanel;