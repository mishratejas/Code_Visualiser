import React, { useState, useEffect, useRef } from 'react';
import {
    Card, Row, Col, Button, Typography, Space, Divider,
    Steps, Radio, Input, Alert, Select, Slider, Statistic,
    Progress, List, Tag, Modal, Form, message, Spin, Timeline,
    Collapse, Badge, Tabs, Avatar
} from 'antd';
import {
    CommentOutlined,
    CodeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined,
    BulbOutlined,
    UserOutlined,
    TrophyOutlined,
    SendOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import interviewService from '../services/interview.js';
import aiService from '../services/ai.js';
import InterviewAssistant from '../components/ai/InterviewAssistant.jsx';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;
const { TextArea } = Input;

const InterviewPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [interviewState, setInterviewState] = useState({
        status: 'not_started', // not_started, in_progress, completed
        currentStep: 0,
        interviewId: null,
        question: null,
        timer: 1800, // 30 minutes in seconds
        isTimerRunning: false,
        userCode: '',
        userExplanation: '',
        evaluations: [],
        followUpQuestions: [],
        score: 0,
        hintsUsed: 0
    });

    const timerRef = useRef(null);
    const [form] = Form.useForm();

    useEffect(() => {
        if (interviewState.isTimerRunning) {
            timerRef.current = setInterval(() => {
                setInterviewState(prev => ({
                    ...prev,
                    timer: prev.timer > 0 ? prev.timer - 1 : 0
                }));
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [interviewState.isTimerRunning]);

    const startInterview = async (difficulty = 'medium', topics = []) => {
        setLoading(true);
        try {
            const response = await interviewService.startInterview(difficulty, topics);
            const { interview_id, question, started_at, expires_at } = response.data;

            setInterviewState({
                status: 'in_progress',
                currentStep: 0,
                interviewId: interview_id,
                question: question,
                timer: 1800,
                isTimerRunning: true,
                userCode: '',
                userExplanation: '',
                evaluations: [],
                followUpQuestions: [],
                score: 0,
                hintsUsed: 0
            });

            message.success('Interview session started!');
        } catch (error) {
            message.error('Failed to start interview: ' + error.message);
        }
        setLoading(false);
    };

    const submitSolution = async () => {
        if (!interviewState.userCode.trim()) {
            message.warning('Please write some code first');
            return;
        }

        setLoading(true);
        try {
            const response = await interviewService.submitSolution(
                interviewState.interviewId,
                interviewState.userCode,
                interviewState.userExplanation
            );

            const { evaluation, follow_up_question, next_step } = response.data;

            setInterviewState(prev => ({
                ...prev,
                evaluations: [...prev.evaluations, evaluation],
                followUpQuestions: follow_up_question ? 
                    [...prev.followUpQuestions, follow_up_question] : prev.followUpQuestions,
                currentStep: next_step === 'explanation' ? 1 : 2,
                score: prev.score + evaluation.overall_score * 20
            }));

            message.success('Solution submitted successfully!');
        } catch (error) {
            message.error('Failed to submit solution: ' + error.message);
        }
        setLoading(false);
    };

    const submitExplanation = async () => {
        if (!interviewState.userExplanation.trim()) {
            message.warning('Please provide an explanation');
            return;
        }

        setLoading(true);
        try {
            const response = await interviewService.checkExplanation(
                interviewState.userCode,
                interviewState.userExplanation,
                interviewState.question.id
            );

            const { is_correct, feedback, score } = response.data;

            setInterviewState(prev => ({
                ...prev,
                currentStep: 2,
                score: prev.score + (score * 10)
            }));

            Modal.info({
                title: 'Explanation Feedback',
                content: (
                    <div>
                        <Alert
                            message={is_correct ? 'Great Explanation!' : 'Explanation Needs Improvement'}
                            description={feedback}
                            type={is_correct ? 'success' : 'warning'}
                            showIcon
                        />
                    </div>
                )
            });
        } catch (error) {
            message.error('Failed to check explanation: ' + error.message);
        }
        setLoading(false);
    };

    const requestHint = async () => {
        try {
            const response = await interviewService.getHint(
                interviewState.question,
                interviewState.userCode
            );

            const hint = response.data.hint;

            setInterviewState(prev => ({
                ...prev,
                hintsUsed: prev.hintsUsed + 1
            }));

            Modal.info({
                title: '💡 Hint',
                content: hint,
                okText: 'Got it'
            });
        } catch (error) {
            message.error('Failed to get hint: ' + error.message);
        }
    };

    const completeInterview = async () => {
        setLoading(true);
        try {
            const response = await interviewService.getReport(interviewState.interviewId);
            const report = response.data;

            setInterviewState(prev => ({
                ...prev,
                status: 'completed',
                isTimerRunning: false
            }));

            // Show final report
            Modal.success({
                title: '🎉 Interview Completed!',
                width: 800,
                content: (
                    <div style={{ marginTop: 20 }}>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic
                                    title="Final Score"
                                    value={interviewState.score}
                                    suffix="/100"
                                    prefix={<TrophyOutlined />}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Time Taken"
                                    value={Math.floor((1800 - interviewState.timer) / 60)}
                                    suffix="minutes"
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Col>
                            <Col span={24}>
                                <Alert
                                    message="Strengths"
                                    description={
                                        <Space wrap>
                                            {report.strengths?.map((strength, idx) => (
                                                <Tag key={idx} color="green">{strength}</Tag>
                                            ))}
                                        </Space>
                                    }
                                    type="success"
                                    showIcon
                                />
                            </Col>
                            <Col span={24}>
                                <Alert
                                    message="Areas for Improvement"
                                    description={
                                        <Space wrap>
                                            {report.weaknesses?.map((weakness, idx) => (
                                                <Tag key={idx} color="red">{weakness}</Tag>
                                            ))}
                                        </Space>
                                    }
                                    type="warning"
                                    showIcon
                                />
                            </Col>
                            <Col span={24}>
                                <Title level={5}>Recommendations</Title>
                                <List
                                    size="small"
                                    dataSource={report.recommendations}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<BulbOutlined />}
                                                title={item}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Col>
                        </Row>
                    </div>
                ),
                okText: 'Close',
                onOk: () => {
                    // Reset interview
                    setInterviewState({
                        status: 'not_started',
                        currentStep: 0,
                        interviewId: null,
                        question: null,
                        timer: 1800,
                        isTimerRunning: false,
                        userCode: '',
                        userExplanation: '',
                        evaluations: [],
                        followUpQuestions: [],
                        score: 0,
                        hintsUsed: 0
                    });
                }
            });
        } catch (error) {
            message.error('Failed to complete interview: ' + error.message);
        }
        setLoading(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const renderStartScreen = () => (
        <Card style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <Title level={2}>🎤 AI-Powered DSA Interview</Title>
            <Paragraph type="secondary">
                Practice coding interviews with AI-powered evaluation, real-time feedback,
                and personalized follow-up questions.
            </Paragraph>
            
            <Divider />

            <Row gutter={[16, 16]} justify="center">
                <Col span={24}>
                    <Title level={4}>Select Difficulty</Title>
                    <Radio.Group 
                        defaultValue="medium" 
                        size="large"
                        onChange={(e) => form.setFieldValue('difficulty', e.target.value)}
                    >
                        <Radio.Button value="easy">Easy</Radio.Button>
                        <Radio.Button value="medium">Medium</Radio.Button>
                        <Radio.Button value="hard">Hard</Radio.Button>
                    </Radio.Group>
                </Col>

                <Col span={24}>
                    <Title level={4}>Select Topics (Optional)</Title>
                    <Select
                        mode="multiple"
                        placeholder="Choose topics to focus on"
                        style={{ width: '100%' }}
                        onChange={(value) => form.setFieldValue('topics', value)}
                    >
                        <Option value="array">Array</Option>
                        <Option value="string">String</Option>
                        <Option value="linked-list">Linked List</Option>
                        <Option value="tree">Tree</Option>
                        <Option value="graph">Graph</Option>
                        <Option value="dynamic-programming">Dynamic Programming</Option>
                        <Option value="sorting">Sorting</Option>
                        <Option value="searching">Searching</Option>
                    </Select>
                </Col>

                <Col span={24}>
                    <Title level={4}>Interview Duration</Title>
                    <Slider
                        min={15}
                        max={60}
                        step={5}
                        defaultValue={30}
                        marks={{
                            15: '15m',
                            30: '30m',
                            45: '45m',
                            60: '60m'
                        }}
                        onChange={(value) => form.setFieldValue('duration', value)}
                    />
                </Col>

                <Col span={24}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlayCircleOutlined />}
                        onClick={() => {
                            const values = form.getFieldsValue();
                            startInterview(values.difficulty || 'medium', values.topics || []);
                        }}
                        style={{ width: '200px', height: '50px', fontSize: '16px' }}
                    >
                        Start Interview
                    </Button>
                </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Statistic title="Real-time Evaluation" value="AI-powered" />
                </Col>
                <Col span={8}>
                    <Statistic title="Follow-up Questions" value="Dynamic" />
                </Col>
                <Col span={8}>
                    <Statistic title="Personalized Feedback" value="Detailed" />
                </Col>
            </Row>
        </Card>
    );

    const renderInterviewScreen = () => (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <Card>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <Avatar icon={<UserOutlined />} />
                            <div>
                                <Text strong>{user?.username}</Text>
                                <br />
                                <Text type="secondary">AI Interview Session</Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Badge count={interviewState.hintsUsed} showZero>
                                <Button 
                                    icon={<BulbOutlined />} 
                                    onClick={requestHint}
                                    disabled={interviewState.hintsUsed >= 3}
                                >
                                    Hint ({3 - interviewState.hintsUsed} left)
                                </Button>
                            </Badge>
                            <Button
                                type={interviewState.isTimerRunning ? 'default' : 'primary'}
                                icon={interviewState.isTimerRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                onClick={() => setInterviewState(prev => ({
                                    ...prev,
                                    isTimerRunning: !prev.isTimerRunning
                                }))}
                            >
                                {formatTime(interviewState.timer)}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Progress Steps */}
            <Card style={{ marginTop: 16 }}>
                <Steps current={interviewState.currentStep}>
                    <Step 
                        title="Solve Problem" 
                        description="Write your solution"
                        icon={<CodeOutlined />}
                    />
                    <Step 
                        title="Explain Solution" 
                        description="Describe your approach"
                        icon={<CommentOutlined />}
                    />
                    <Step 
                        title="Review" 
                        description="Get feedback"
                        icon={<CheckCircleOutlined />}
                    />
                </Steps>
            </Card>

            {/* Main Content */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {/* Question Panel */}
                <Col span={12}>
                    <Card 
                        title={
                            <Space>
                                <QuestionCircleOutlined />
                                <span>Question</span>
                                <Tag color="blue">{interviewState.question?.difficulty}</Tag>
                            </Space>
                        }
                    >
                        <Title level={4}>{interviewState.question?.title}</Title>
                        <Paragraph>{interviewState.question?.description}</Paragraph>
                        
                        {interviewState.question?.examples?.map((example, idx) => (
                            <Collapse key={idx} style={{ marginBottom: 8 }}>
                                <Panel header={`Example ${idx + 1}`} key={idx}>
                                    <Text strong>Input:</Text>
                                    <pre style={{ margin: '8px 0' }}>{example.input}</pre>
                                    <Text strong>Output:</Text>
                                    <pre style={{ margin: '8px 0' }}>{example.output}</pre>
                                    {example.explanation && (
                                        <>
                                            <Text strong>Explanation:</Text>
                                            <p>{example.explanation}</p>
                                        </>
                                    )}
                                </Panel>
                            </Collapse>
                        ))}

                        <Divider />

                        <Title level={5}>Constraints</Title>
                        <List
                            size="small"
                            dataSource={Object.entries(interviewState.question?.constraints || {})}
                            renderItem={([key, value]) => (
                                <List.Item>
                                    <Text code>{key}:</Text> {value}
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* Coding & Explanation Panel */}
                <Col span={12}>
                    <Tabs defaultActiveKey="code">
                        <TabPane tab="Write Code" key="code">
                            <Card
                                title="Your Solution"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={submitSolution}
                                        loading={loading}
                                    >
                                        Submit Solution
                                    </Button>
                                }
                            >
                                <TextArea
                                    value={interviewState.userCode}
                                    onChange={(e) => setInterviewState(prev => ({
                                        ...prev,
                                        userCode: e.target.value
                                    }))}
                                    placeholder="Write your solution here..."
                                    rows={15}
                                    style={{ fontFamily: 'monospace' }}
                                />
                                
                                <div style={{ marginTop: 16 }}>
                                    <Select 
                                        defaultValue="python" 
                                        style={{ width: 120 }}
                                        onChange={(value) => console.log('Language:', value)}
                                    >
                                        <Option value="python">Python</Option>
                                        <Option value="java">Java</Option>
                                        <Option value="cpp">C++</Option>
                                        <Option value="javascript">JavaScript</Option>
                                    </Select>
                                </div>
                            </Card>
                        </TabPane>

                        <TabPane tab="Explanation" key="explanation">
                            <Card
                                title="Explain Your Solution"
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={submitExplanation}
                                        loading={loading}
                                        disabled={!interviewState.userCode.trim()}
                                    >
                                        Submit Explanation
                                    </Button>
                                }
                            >
                                <TextArea
                                    value={interviewState.userExplanation}
                                    onChange={(e) => setInterviewState(prev => ({
                                        ...prev,
                                        userExplanation: e.target.value
                                    }))}
                                    placeholder="Explain your approach, time complexity, space complexity, and edge cases..."
                                    rows={10}
                                />
                                
                                <Alert
                                    message="What to include in your explanation:"
                                    description={
                                        <ul>
                                            <li>Approach/Algorithm used</li>
                                            <li>Time Complexity (Big O notation)</li>
                                            <li>Space Complexity (Big O notation)</li>
                                            <li>Edge cases considered</li>
                                            <li>Trade-offs and alternatives</li>
                                        </ul>
                                    }
                                    type="info"
                                    style={{ marginTop: 16 }}
                                />
                            </Card>
                        </TabPane>

                        <TabPane tab="Feedback" key="feedback">
                            <InterviewAssistant
                                evaluations={interviewState.evaluations}
                                followUpQuestions={interviewState.followUpQuestions}
                                onCompleteInterview={completeInterview}
                            />
                        </TabPane>
                    </Tabs>
                </Col>
            </Row>

            {/* Score and Progress */}
            <Card style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Progress 
                            type="circle" 
                            percent={Math.min(interviewState.score, 100)} 
                            width={80}
                            format={() => `${interviewState.score}/100`}
                        />
                    </Col>
                    <Col span={16}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Progress 
                                percent={Math.min(interviewState.score, 100)} 
                                status="active"
                            />
                            <Text>Overall Score</Text>
                            <Row gutter={[8, 8]}>
                                {interviewState.evaluations.map((evalItem, idx) => (
                                    <Col key={idx}>
                                        <Tag color={evalItem.overall_score >= 0.7 ? 'green' : 'orange'}>
                                            Q{idx + 1}: {(evalItem.overall_score * 100).toFixed(0)}%
                                        </Tag>
                                    </Col>
                                ))}
                            </Row>
                        </Space>
                    </Col>
                </Row>
            </Card>
        </div>
    );

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
                <p>Loading interview session...</p>
            </div>
        );
    }

    return (
        <div>
            {interviewState.status === 'not_started' && renderStartScreen()}
            {interviewState.status === 'in_progress' && renderInterviewScreen()}
            {interviewState.status === 'completed' && renderStartScreen()}
        </div>
    );
};

export default InterviewPage;