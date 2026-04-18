import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Assessment } from '../types';

interface ClientListProps {
  onSelect: (assessment: Assessment) => void;
}

const ClientList: React.FC<ClientListProps> = ({ onSelect }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clients-wrapper">
      <div className="clients-header">
        <h1>Client Directory</h1>
        <p>Review and manage active assessment protocols.</p>
      </div>

      {loading ? (
        <p>Loading database records...</p>
      ) : (
        <div className="clients-grid">
          {assessments.map(a => (
            <div 
              key={a.id}
              className="client-card"
              onClick={() => onSelect(a)}
            >
              <div className="cc-name">{a.client_name}</div>
              <div className="cc-meta">
                UHID: {a.uhid || 'N/A'} • {a.age}y • {a.gender} • Score: <strong>{a.overall_score}%</strong>
              </div>
              <div className="cc-meta" style={{ marginTop: '10px', fontSize: '11px' }}>
                Last updated: {new Date(a.created_at || '').toLocaleDateString()}
              </div>
            </div>
          ))}

          {assessments.length === 0 && (
            <div className="client-card" style={{ borderStyle: 'dashed', textAlign: 'center' }}>
              <div className="cc-name">No Records Found</div>
              <div className="cc-meta">Add a new client assessment to get started.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientList;
