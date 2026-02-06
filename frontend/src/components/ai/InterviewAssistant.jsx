import React, { useState } from 'react';
import {
    Card, Row, Col, Typography, Progress, Tag, Alert,
    List, Button, Space, Divider, Statistic, Timeline,
    Collapse, Radio, Input, Rate, Comment, Avatar
} from 'antd';
import {
    MessageOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BulbOutlined,
    UserOutlined,
    LikeOutlined,
    DislikeOutlined,
    TrophyOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const InterviewAssistant = ({ 
    evaluations = [], 
    followUpQuestions = [],
    onCompleteInterview 
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);

    const calculateOverallScore = () => {
        if (evaluations.length === 0) return 0;
        const total = evaluations.reduce((sum, evalItem) => sum + evalItem.overall_score, 0);
        return Math.round((total / evaluations.length) * 100);
    };

    const getPerformanceLevel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 65) return 'Good';
        if (score >= 50) return 'Fair';
        return 'Needs Improvement';
    };

    const renderEvaluationCards = () => (
        <Row gutter={[16, 16]}>
            {evaluations.map((evalItem, index) => (
                <Col key={index} xs={24} sm={12} lg={8}>
                    <Card size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>Question {index + 1}</Text>
                                <Tag color={evalItem.overall_score >= 0.7 ? 'green' : 'orange'}>
                                    {(evalItem.overall_score * 100).toFixed(0)}%
                                </Tag>
                            </div>
                            
                            <Progress 
                                percent={evalItem.overall_score * 100} 
                                size="small"
                                status={evalItem.overall_score >= 0.7 ? 'success' : 'normal'}
                            />
                            
                            <Collapse size="small">
                                <Panel header="Detailed Feedback" key="1">
                                    <Text type="secondary">{evalItem.feedback}</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong>Suggestions:</Text>
                                        <List
                                            size="small"
                                            dataSource={evalItem.suggestions || []}
                                            renderItem={(item, idx) => (
                                                <List.Item>
                                                    <BulbOutlined style={{ marginRight: 8 }} />
                                                    {item}
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                </Panel>
                            </Collapse>
                        </Space>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    const renderFollowUpQuestions = () => {
        if (followUpQuestions.length === 0) return null;

        return (
            <Card title="Follow-up Questions" style={{ marginTop: 16 }}>
                <List
                    dataSource={followUpQuestions}
                    renderItem={(question, index) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar icon={<MessageOutlined />} />}
                                title={`Follow-up ${index + 1}`}
                                description={
                                    <Space direction="vertical">
                                        <Text>{question.question}</Text>
                                        {question.hint && (
                                            <Alert
                                                message="Hint"
                                                description={question.hint}
                                                type="info"
                                                size="small"
                                            />
                                        )}
                                    </Space>
                                }
                            />
                            <Button type="link">Answer</Button>
                        </List.Item>
                    )}
                />
            </Card>
        );
    };

    const renderSummary = () => (
        <Card title="Interview Summary" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Progress
                                type="circle"
                                percent={calculateOverallScore()}
                                width={120}
                                format={percent => (
                                    <div>
                                        <Title level={2}>{percent}%</Title>
                                        <Text type="secondary">Score</Text>
                                    </div>
                                )}
                            />
                        </div>
                        
                        <Divider />
                        
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Statistic
                                    title="Code Quality"
                                    value={Math.round(
                                        evaluations.reduce((sum, e) => sum + e.code_quality, 0) / 
                                        evaluations.length * 100
                                    )}
                                    suffix="%"
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Efficiency"
                                    value={Math.round(
                                        evaluations.reduce((sum, e) => sum + e.efficiency, 0) / 
                                        evaluations.length * 100
                                    )}
                                    suffix="%"
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Explanation"
                                    value={Math.round(
                                        evaluations.reduce((sum, e) => sum + e.explanation_quality, 0) / 
                                        evaluations.length * 100
                                    )}
                                    suffix="%"
                                />
                            </Col>
                        </Row>
                        
                        <Alert
                            message={`Performance: ${getPerformanceLevel(calculateOverallScore())}`}
                            description="Based on your performance across all questions"
                            type={
                                calculateOverallScore() >= 80 ? 'success' :
                                calculateOverallScore() >= 65 ? 'info' : 'warning'
                            }
                            showIcon
                        />
                    </Space>
                </Col>
            </Row>
        </Card>
    );

    const renderFeedbackForm = () => (
        <Card title="Your Feedback" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>How was your interview experience?</Text>
                <Rate 
                    value={rating} 
                    onChange={setRating}
                    character={<TrophyOutlined />}
                />
                
                <TextArea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your thoughts about the interview..."
                    rows={4}
                />
                
                <Button type="primary" onClick={() => {
                    // Submit feedback
                    message.success('Feedback submitted!');
                    if (onCompleteInterview) {
                        onCompleteInterview();
                    }
                }}>
                    Complete Interview
                </Button>
            </Space>
        </Card>
    );

    return (
        <div>
            <Title level={3}>Interview Assistant</Title>
            <Paragraph type="secondary">
                Real-time feedback and evaluation for your interview performance
            </Paragraph>
            
            <Divider />
            
            {evaluations.length > 0 ? (
                <>
                    {renderEvaluationCards()}
                    {renderFollowUpQuestions()}
                    {renderSummary()}
                    {renderFeedbackForm()}
                </>
            ) : (
                <Alert
                    message="No evaluations yet"
                    description="Submit your first solution to see AI-powered feedback"
                    type="info"
                    showIcon
                />
            )}
        </div>
    );
};

export default InterviewAssistant;