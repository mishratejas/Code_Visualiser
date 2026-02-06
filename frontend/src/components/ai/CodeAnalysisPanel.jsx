import React, { useState, useEffect } from 'react';
import { Card, Badge, Progress, List, Tag, Tooltip, Alert } from 'antd';
import { 
    CheckCircleOutlined, 
    WarningOutlined, 
    ClockCircleOutlined,
    CodeOutlined,
    BulbOutlined 
} from '@ant-design/icons';

const CodeAnalysisPanel = ({ submissionId, analysis }) => {
    const [loading, setLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(analysis || null);
    
    useEffect(() => {
        if (!analysis && submissionId) {
            fetchAnalysis();
        }
    }, [submissionId]);
    
    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/ai/submissions/${submissionId}/analysis`);
            const data = await response.json();
            setAiAnalysis(data);
        } catch (error) {
            console.error('Failed to fetch AI analysis:', error);
        }
        setLoading(false);
    };
    
    if (!aiAnalysis) return null;
    
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
    
    return (
        <Card 
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BulbOutlined /> 
                    <span>AI Code Analysis</span>
                    {aiAnalysis.quality_label && (
                        <Badge 
                            color={getQualityColor(aiAnalysis.quality_score)}
                            text={aiAnalysis.quality_label.toUpperCase()}
                            style={{ marginLeft: 'auto' }}
                        />
                    )}
                </div>
            }
            loading={loading}
            style={{ marginTop: 16 }}
        >
            {/* Quality Score */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>
                        <CheckCircleOutlined style={{ marginRight: 8 }} />
                        Code Quality
                    </span>
                    <span style={{ fontWeight: 'bold', color: getQualityColor(aiAnalysis.quality_score) }}>
                        {(aiAnalysis.quality_score * 100).toFixed(0)}%
                    </span>
                </div>
                <Progress 
                    percent={aiAnalysis.quality_score * 100}
                    strokeColor={getQualityColor(aiAnalysis.quality_score)}
                    showInfo={false}
                />
            </div>
            
            {/* Complexity Analysis */}
            <div style={{ marginBottom: 24 }}>
                <h4>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Complexity Analysis
                </h4>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Tooltip title="Time Complexity">
                        <Tag color={getComplexityColor(aiAnalysis.time_complexity)}>
                            Time: {aiAnalysis.time_complexity}
                        </Tag>
                    </Tooltip>
                    <Tooltip title="Space Complexity">
                        <Tag color="cyan">
                            Space: {aiAnalysis.space_complexity || 'O(1)'}
                        </Tag>
                    </Tooltip>
                    {aiAnalysis.cyclomatic_complexity && (
                        <Tooltip title="Cyclomatic Complexity (lower is better)">
                            <Tag color="purple">
                                CC: {aiAnalysis.cyclomatic_complexity}
                            </Tag>
                        </Tooltip>
                    )}
                </div>
            </div>
            
            {/* Anti-patterns and Suggestions */}
            {aiAnalysis.anti_patterns && aiAnalysis.anti_patterns.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h4>
                        <WarningOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                        Issues Detected
                    </h4>
                    <List
                        size="small"
                        dataSource={aiAnalysis.anti_patterns}
                        renderItem={(item, index) => (
                            <List.Item>
                                <Alert
                                    message={item.type}
                                    description={item.description}
                                    type="warning"
                                    showIcon
                                    style={{ width: '100%' }}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )}
            
            {/* Improvement Suggestions */}
            {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                <div>
                    <h4>
                        <CodeOutlined style={{ marginRight: 8 }} />
                        Improvement Suggestions
                    </h4>
                    <List
                        size="small"
                        dataSource={aiAnalysis.suggestions}
                        renderItem={(item, index) => (
                            <List.Item>
                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <div style={{ 
                                        backgroundColor: '#1890ff', 
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 8,
                                        flexShrink: 0
                                    }}>
                                        {index + 1}
                                    </div>
                                    <span>{item}</span>
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            )}
            
            {/* Performance Rating */}
            {aiAnalysis.performance_rating && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span style={{ fontWeight: 'bold' }}>
                            Performance: {aiAnalysis.performance_rating.toUpperCase()}
                        </span>
                    </div>
                    {aiAnalysis.bottleneck_analysis && aiAnalysis.bottleneck_analysis.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 'smaller' }}>
                            {aiAnalysis.bottleneck_analysis.join(' ')}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default CodeAnalysisPanel;