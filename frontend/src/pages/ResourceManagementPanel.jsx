
import React, { useState, useEffect } from 'react';

const ResourceManagementPanel = ({ 
  resources, 
  onUpdateResources, 
  addActivity,
  showToast 
}) => {
  const [editingResource, setEditingResource] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'personnel', 'vehicles', 'equipment'
  const [editForm, setEditForm] = useState({
    available: 0,
    deployed: 0,
    total: 0
  });
  const [resourceHistory, setResourceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [addResourceModal, setAddResourceModal] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [customResources, setCustomResources] = useState([]);

  // Resource categories with subcategories
  const resourceCategories = {
    personnel: {
      icon: '👥',
      label: 'Personnel',
      color: '#8b5cf6',
      subcategories: [
        { id: 'field_officers', name: 'Field Officers', count: 15 },
        { id: 'medical_staff', name: 'Medical Staff', count: 12 },
        { id: 'rescue_team', name: 'Rescue Team', count: 20 },
        { id: 'communications', name: 'Communications', count: 8 },
        { id: 'logistics', name: 'Logistics', count: 13 }
      ]
    },
    vehicles: {
      icon: '🚒',
      label: 'Vehicles',
      color: '#ff9800',
      subcategories: [
        { id: 'fire_trucks', name: 'Fire Trucks', count: 4 },
        { id: 'ambulances', name: 'Ambulances', count: 6 },
        { id: 'rescue_vehicles', name: 'Rescue Vehicles', count: 5 },
        { id: 'helicopters', name: 'Helicopters', count: 2 },
        { id: 'boats', name: 'Boats', count: 3 }
      ]
    },
    equipment: {
      icon: '🔧',
      label: 'Equipment',
      color: '#2196f3',
      subcategories: [
        { id: 'medical_kits', name: 'Medical Kits', count: 25 },
        { id: 'rescue_tools', name: 'Rescue Tools', count: 15 },
        { id: 'communication_devices', name: 'Communication Devices', count: 20 },
        { id: 'power_generators', name: 'Power Generators', count: 8 },
        { id: 'water_pumps', name: 'Water Pumps', count: 12 }
      ]
    }
  };

  const [subcategories, setSubcategories] = useState(resourceCategories);

  // Handle opening edit modal
  const handleEditResource = (type) => {
    setModalType(type);
    setEditForm({
      available: resources[type].available,
      deployed: resources[type].deployed,
      total: resources[type].total
    });
    setShowModal(true);
  };

  // Handle form change
  const handleFormChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setEditForm(prev => {
      const updated = { ...prev, [field]: numValue };
      // Auto-calculate total
      updated.total = updated.available + updated.deployed;
      return updated;
    });
  };

  // Save resource changes
  const handleSaveChanges = () => {
    const oldResource = resources[modalType];
    const newResource = editForm;

    // Update resources
    onUpdateResources(prev => ({
      ...prev,
      [modalType]: newResource
    }));

    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: modalType,
      action: 'Updated',
      timestamp: new Date(),
      changes: {
        available: { from: oldResource.available, to: newResource.available },
        deployed: { from: oldResource.deployed, to: newResource.deployed },
        total: { from: oldResource.total, to: newResource.total }
      },
      officer: 'Current Officer'
    };
    setResourceHistory(prev => [historyEntry, ...prev]);

    // Log activity
    addActivity('Resource Update', `${resourceCategories[modalType].label}: ${oldResource.available}\u2192${newResource.available} available, ${oldResource.deployed}\u2192${newResource.deployed} deployed`);

    // Show toast
    showToast(`${resourceCategories[modalType].label} updated successfully!`, 'success');

    setShowModal(false);
  };

  // Deploy one unit
  const handleDeploy = (type) => {
    if (resources[type].available <= 0) {
      showToast('No available resources to deploy!', 'error');
      return;
    }

    onUpdateResources(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        available: prev[type].available - 1,
        deployed: prev[type].deployed + 1
      }
    }));

    addActivity('Deployed Resource', `1 ${resourceCategories[type].label} unit deployed`);
    showToast(`${resourceCategories[type].label} deployed!`, 'success');
  };

  // Return one unit
  const handleReturn = (type) => {
    if (resources[type].deployed <= 0) {
      showToast('No deployed resources to return!', 'error');
      return;
    }

    onUpdateResources(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        available: prev[type].available + 1,
        deployed: prev[type].deployed - 1
      }
    }));

    addActivity('Returned Resource', `1 ${resourceCategories[type].label} unit returned`);
    showToast(`${resourceCategories[type].label} returned!`, 'success');
  };

  // Handle subcategory edit
  const handleSubcategoryEdit = (mainType, subId, newValue) => {
    setSubcategories(prev => ({
      ...prev,
      [mainType]: {
        ...prev[mainType],
        subcategories: prev[mainType].subcategories.map(sub =>
          sub.id === subId ? { ...sub, count: newValue } : sub
        )
      }
    }));
    addActivity('Resource Count Changed', `${resourceCategories[mainType].subcategories.find(s => s.id === subId)?.name}: ${newValue}`);
  };

  // Add new custom resource
  const handleAddCustomResource = () => {
    if (!newResourceName.trim()) return;
    
    const newResource = {
      id: `custom_${Date.now()}`,
      name: newResourceName,
      icon: '\ud83d\udce6',
      available: 0,
      deployed: 0,
      total: 0,
      isCustom: true
    };
    
    setCustomResources(prev => [...prev, newResource]);
    setNewResourceName('');
    setAddResourceModal(false);
    addActivity('Resource Added', `New resource type: ${newResourceName}`);
    showToast(`Resource "${newResourceName}" added!`, 'success');
  };

  const styles = {
    container: {
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0
    },
    addButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    resourceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '20px'
    },
    resourceCard: {
      background: 'rgba(30, 30, 50, 0.6)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    cardHeader: (color) => ({
      padding: '20px',
      background: `linear-gradient(90deg, ${color}20, transparent)`,
      borderBottom: `1px solid ${color}40`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }),
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    icon: {
      width: '45px',
      height: '45px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    },
    cardBody: {
      padding: '20px'
    },
    statsRow: {
      display: 'flex',
      justifyContent: 'space-around',
      marginBottom: '20px'
    },
    statItem: (color) => ({
      textAlign: 'center',
      padding: '15px',
      background: `${color}10`,
      borderRadius: '10px',
      minWidth: '80px'
    }),
    statValue: (color) => ({
      fontSize: '32px',
      fontWeight: 'bold',
      color
    }),
    statLabel: {
      fontSize: '12px',
      color: '#888',
      marginTop: '5px'
    },
    progressBar: {
      height: '8px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
      marginBottom: '15px',
      overflow: 'hidden'
    },
    progressFill: (percentage, color) => ({
      width: `${percentage}%`,
      height: '100%',
      background: `linear-gradient(90deg, ${color}, ${color}aa)`,
      borderRadius: '4px',
      transition: 'width 0.5s ease'
    }),
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    },
    actionButton: (variant) => ({
      flex: 1,
      padding: '12px',
      background: variant === 'deploy' ? 'linear-gradient(135deg, #ff9800, #f57c00)' 
        : variant === 'return' ? 'linear-gradient(135deg, #4caf50, #388e3c)'
        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    }),
    subcategoriesList: {
      marginTop: '15px'
    },
    subcategoryItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 15px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      marginBottom: '8px'
    },
    subcategoryName: {
      fontSize: '13px',
      color: '#ccc'
    },
    subcategoryControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subcategoryButton: {
      width: '28px',
      height: '28px',
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    subcategoryValue: {
      fontSize: '14px',
      fontWeight: 'bold',
      minWidth: '30px',
      textAlign: 'center'
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    },
    modal: {
      background: 'linear-gradient(135deg, #1a1a2e, #16162a)',
      borderRadius: '16px',
      padding: '30px',
      width: '100%',
      maxWidth: '450px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: 0
    },
    closeButton: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 12px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '18px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      color: '#aaa'
    },
    formInput: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '10px',
      color: 'white',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px'
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      marginTop: '25px'
    },
    cancelButton: {
      flex: 1,
      padding: '14px',
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '10px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    saveButton: {
      flex: 1,
      padding: '14px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      border: 'none',
      borderRadius: '10px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    // History styles
    historySection: {
      marginTop: '30px',
      background: 'rgba(30, 30, 50, 0.4)',
      borderRadius: '12px',
      padding: '20px'
    },
    historyTitle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    historyItem: {
      padding: '12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      marginBottom: '8px',
      fontSize: '13px'
    },
    historyChanges: {
      color: '#8b5cf6',
      fontSize: '12px',
      marginTop: '5px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}> Resource Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            style={{ ...styles.addButton, background: 'rgba(255,255,255,0.1)' }}
          >
            📜 History
          </button>
          <button 
            onClick={() => setAddResourceModal(true)}
            style={styles.addButton}
          >
            🆕 Add Resource Type
          </button>
        </div>
      </div>

      {/* Main Resource Cards */}
      <div style={styles.resourceGrid}>
        {Object.entries(resourceCategories).map(([type, config]) => (
          <div key={type} style={styles.resourceCard}>
            <div style={styles.cardHeader(config.color)}>
              <div style={styles.cardTitle}>
                <div style={styles.icon}>{config.icon}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{config.label}</h3>
                  <span style={{ fontSize: '12px', color: '#888' }}>Resource Management</span>
                </div>
              </div>
              <button 
                onClick={() => handleEditResource(type)}
                style={{ 
                  background: `${config.color}30`,
                  border: `1px solid ${config.color}50`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: config.color,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                ✏ Edit
              </button>
            </div>

            <div style={styles.cardBody}>
              {/* Stats */}
              <div style={styles.statsRow}>
                <div style={styles.statItem('#4caf50')}>
                  <div style={styles.statValue('#4caf50')}>{resources?.[type]?.available ?? 0}</div>
                  <div style={styles.statLabel}>Available</div>
                </div>
                <div style={styles.statItem('#ff9800')}>
                  <div style={styles.statValue('#ff9800')}>{resources?.[type]?.deployed ?? 0}</div>
                  <div style={styles.statLabel}>Deployed</div>
                </div>
                <div style={styles.statItem(config.color)}>
                  <div style={styles.statValue(config.color)}>{resources?.[type]?.total ?? 0}</div>
                  <div style={styles.statLabel}>Total</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={styles.progressBar}>
                <div style={styles.progressFill(
                  resources[type].total > 0 
                    ? (resources[type].deployed / resources[type].total) * 100 
                    : 0,
                  config.color
                )} />
              </div>

              {/* Quick Actions */}
              <div style={styles.actionButtons}>
                <button 
                  onClick={() => handleDeploy(type)}
                  style={styles.actionButton('deploy')}
                  disabled={(resources?.[type]?.available ?? 0) <= 0}
                >
                  🚀 Deploy (-1)
                </button>
                <button 
                  onClick={() => handleReturn(type)}
                  style={styles.actionButton('return')}
                disabled={(resources?.[type]?.deployed ?? 0) <= 0}
                >
                  ↩ Return (+1)
                </button>
              </div>

              {/* Subcategories */}
              <div style={styles.subcategoriesList}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                  Detailed Breakdown:
                </div>
                {subcategories[type].subcategories.map(sub => (
                  <div key={sub.id} style={styles.subcategoryItem}>
                    <span style={styles.subcategoryName}>{sub.name}</span>
                    <div style={styles.subcategoryControls}>
                      <button 
                        onClick={() => handleSubcategoryEdit(type, sub.id, Math.max(0, sub.count - 1))}
                        style={styles.subcategoryButton}
                      >
                        -
                      </button>
                      <span style={styles.subcategoryValue}>{sub.count}</span>
                      <button 
                        onClick={() => handleSubcategoryEdit(type, sub.id, sub.count + 1)}
                        style={styles.subcategoryButton}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Custom Resources */}
        {customResources.map(resource => (
          <div key={resource.id} style={styles.resourceCard}>
            <div style={styles.cardHeader('#6366f1')}>
              <div style={styles.cardTitle}>
                <div style={styles.icon}>{resource.icon}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{resource.name}</h3>
                  <span style={{ fontSize: '12px', color: '#888' }}>Custom Resource</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCustomResources(prev => prev.filter(r => r.id !== resource.id));
                  showToast(`Resource "${resource.name}" removed`, 'success');
                }}
                style={{ 
                  background: '#ff525230',
                  border: '1px solid #ff525250',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ff5252',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                \ud83d\uddd1\ufe0f Delete
              </button>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.statsRow}>
                <div style={styles.statItem('#4caf50')}>
                  <div style={styles.statValue('#4caf50')}>{resource.available}</div>
                  <div style={styles.statLabel}>Available</div>
                </div>
                <div style={styles.statItem('#ff9800')}>
                  <div style={styles.statValue('#ff9800')}>{resource.deployed}</div>
                  <div style={styles.statLabel}>Deployed</div>
                </div>
                <div style={styles.statItem('#6366f1')}>
                  <div style={styles.statValue('#6366f1')}>{resource.total}</div>
                  <div style={styles.statLabel}>Total</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* History Section */}
      {showHistory && (
        <div style={styles.historySection}>
          <div style={styles.historyTitle}>
            <h3 style={{ margin: 0 }}> Resource Change History</h3>
            <button 
              onClick={() => setResourceHistory([])}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px 12px', color: '#888', cursor: 'pointer', fontSize: '12px' }}
            >
              Clear History
            </button>
          </div>
          {resourceHistory.length > 0 ? (
            resourceHistory.map(entry => (
              <div key={entry.id} style={styles.historyItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{resourceCategories[entry.type]?.label || entry.type}</strong>
                  <span style={{ color: '#888', fontSize: '11px' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={styles.historyChanges}>
                  Available: {entry.changes.available.from} \u2192 {entry.changes.available.to} | 
                  Deployed: {entry.changes.deployed.from} \u2192 {entry.changes.deployed.to}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No history yet. Make changes to track them here.
            </p>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                \u270f\ufe0f Edit {resourceCategories[modalType]?.label}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.closeButton}>
                ✖
              </button>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Available</label>
                <input 
                  type="number"
                  value={editForm.available}
                  onChange={(e) => handleFormChange('available', e.target.value)}
                  min="0"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Deployed</label>
                <input 
                  type="number"
                  value={editForm.deployed}
                  onChange={(e) => handleFormChange('deployed', e.target.value)}
                  min="0"
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Total (Auto-calculated)</label>
              <input 
                type="number"
                value={editForm.total}
                readOnly
                style={{ ...styles.formInput, background: 'rgba(255,255,255,0.02)', color: '#888' }}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSaveChanges} style={styles.saveButton}>
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {addResourceModal && (
        <div style={styles.modalOverlay} onClick={() => setAddResourceModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}> Add New Resource Type</h3>
              <button onClick={() => setAddResourceModal(false)} style={styles.closeButton}>
               ✖
              </button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Resource Name</label>
              <input 
                type="text"
                value={newResourceName}
                onChange={(e) => setNewResourceName(e.target.value)}
                placeholder="e.g., Drones, Search Dogs, etc."
                style={styles.formInput}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setAddResourceModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleAddCustomResource} style={styles.saveButton}>
                 Add Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagementPanel;
