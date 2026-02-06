import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Tag,
    Progress,
    Alert,
    Typography,
    Space,
    Button,
    Modal,
    Row,
    Col,
    Statistic,
    Timeline,
    List,
    Divider
} from 'antd';

import {
    WarningOutlined,
    CheckCircleOutlined,
    LineChartOutlined,
    EyeOutlined,
    FileTextOutlined,
    PercentageOutlined
} from '@ant-design/icons';

import aiService from '../../services/ai.js';

const { Text } = Typography;

const PlagiarismReport = ({ contestId, adminView = false }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [selectedPair, setSelectedPair] = useState(null);
    const [comparisonModal, setComparisonModal] = useState(false);

    useEffect(() => {
        if (contestId) fetchPlagiarismReport();
    }, [contestId]);

    const fetchPlagiarismReport = async () => {
        setLoading(true);
        try {
            const res = await aiService.checkPlagiarism(contestId);
            setReport(res.data);
        } catch (err) {
            console.error('Failed to fetch plagiarism report:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSimilarityColor = (s) => {
        if (s >= 0.9) return '#cf1322';
        if (s >= 0.8) return '#fa541c';
        if (s >= 0.7) return '#fa8c16';
        if (s >= 0.6) return '#faad14';
        return '#52c41a';
    };

    const getSuspicionLevel = (s) => {
        if (s >= 0.9) return 'Very High';
        if (s >= 0.85) return 'High';
        if (s >= 0.75) return 'Medium';
        if (s >= 0.65) return 'Low';
        return 'Normal';
    };

    const renderSummary = () => {
        if (!report) return null;

        return (
            <Card title="Plagiarism Check Summary" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col span={6}>
                        <Statistic
                            title="Total Submissions"
                            value={report.total_submissions}
                            prefix={<FileTextOutlined />}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Suspicious Pairs"
                            value={report.suspicious_pairs?.length || 0}
                            prefix={<WarningOutlined />}
                            valueStyle={{
                                color:
                                    report.suspicious_pairs?.length > 0
                                        ? '#cf1322'
                                        : '#52c41a'
                            }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Average Similarity"
                            value={(report.average_similarity * 100).toFixed(1)}
                            suffix="%"
                            prefix={<PercentageOutlined />}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Checked At"
                            value={new Date(report.checked_at).toLocaleDateString()}
                            prefix={<LineChartOutlined />}
                        />
                    </Col>
                </Row>

                <Divider />

                <Alert
                    message={
                        report.suspicious_pairs?.length
                            ? `${report.suspicious_pairs.length} suspicious pairs detected`
                            : 'No plagiarism detected'
                    }
                    type={report.suspicious_pairs?.length ? 'warning' : 'success'}
                    showIcon
                />
            </Card>
        );
    };

    const renderSuspiciousPairs = () => {
        if (!report?.suspicious_pairs?.length) return null;

        const columns = [
            {
                title: 'Pair',
                render: (_, r) => (
                    <Space>
                        <Text strong>#{r.submission1_id.slice(0, 8)}</Text>
                        <Text>vs</Text>
                        <Text strong>#{r.submission2_id.slice(0, 8)}</Text>
                    </Space>
                )
            },
            {
                title: 'Similarity',
                render: (_, r) => (
                    <Space>
                        <Progress
                            type="circle"
                            percent={Math.round(r.similarity_score * 100)}
                            width={40}
                            strokeColor={getSimilarityColor(r.similarity_score)}
                        />
                        <Text strong style={{ color: getSimilarityColor(r.similarity_score) }}>
                            {(r.similarity_score * 100).toFixed(1)}%
                        </Text>
                    </Space>
                )
            },
            {
                title: 'Level',
                render: (_, r) => {
                    const lvl = getSuspicionLevel(r.similarity_score);
                    const color =
                        lvl === 'Very High'
                            ? 'red'
                            : lvl === 'High'
                            ? 'volcano'
                            : lvl === 'Medium'
                            ? 'orange'
                            : lvl === 'Low'
                            ? 'blue'
                            : 'green';
                    return <Tag color={color}>{lvl}</Tag>;
                }
            },
            {
                title: 'Actions',
                render: (_, r) => (
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedPair(r);
                            setComparisonModal(true);
                        }}
                    >
                        Compare
                    </Button>
                )
            }
        ];

        return (
            <Card title="Suspicious Submission Pairs">
                <Table
                    loading={loading}
                    dataSource={report.suspicious_pairs}
                    columns={columns}
                    rowKey={(r) => `${r.submission1_id}-${r.submission2_id}`}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        );
    };

    const renderComparisonModal = () => {
        if (!selectedPair) return null;

        return (
            <Modal
                title="Code Comparison"
                open={comparisonModal}
                onCancel={() => setComparisonModal(false)}
                footer={null}
                width={1200}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Card title="Submission 1">
                            <pre style={{ background: '#f6f8fa', padding: 16 }}>
{`function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`}
                            </pre>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Submission 2">
                            <pre style={{ background: '#fff2f0', padding: 16 }}>
{`function findTwoSum(arr, target) {
    let hash = {};
    for (let i = 0; i < arr.length; i++) {
        let diff = target - arr[i];
        if (hash[diff] !== undefined) {
            return [hash[diff], i];
        }
        hash[arr[i]] = i;
    }
    return [];
}`}
                            </pre>
                        </Card>
                    </Col>
                </Row>

                <Divider />

                <Timeline>
                    <Timeline.Item color="green">
                        Token Similarity: {(selectedPair.token_similarity * 100).toFixed(1)}%
                    </Timeline.Item>
                    <Timeline.Item color="blue">
                        AST Similarity: {(selectedPair.ast_similarity * 100).toFixed(1)}%
                    </Timeline.Item>
                    <Timeline.Item color="orange">
                        Structural Similarity:{' '}
                        {(selectedPair.structural_similarity * 100).toFixed(1)}%
                    </Timeline.Item>
                </Timeline>

                {adminView && (
                    <div style={{ textAlign: 'right' }}>
                        <Button danger type="primary">
                            Flag as Plagiarism
                        </Button>
                    </div>
                )}
            </Modal>
        );
    };

    const renderRecommendations = () => {
        if (!report?.suspicious_pairs?.length) return null;

        return (
            <Card title="Recommended Actions">
                <List
                    dataSource={[
                        'Review high similarity pairs manually',
                        'Check submission timestamps',
                        'Verify IP / device similarity',
                        'Conduct oral explanation if required'
                    ]}
                    renderItem={(i) => (
                        <List.Item>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                            {i}
                        </List.Item>
                    )}
                />
            </Card>
        );
    };

    return (
        <>
            {renderSummary()}
            {renderSuspiciousPairs()}
            {renderRecommendations()}
            {renderComparisonModal()}
        </>
    );
};

export default PlagiarismReport;
