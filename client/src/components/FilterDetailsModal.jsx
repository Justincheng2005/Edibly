import React from 'react';
import './FilterDetailsModal.css';

const FilterDetailsModal = ({ isOpen, onClose, filterData }) => {
    if (!isOpen) return null;

    // Extract filtered out items from data
    const filteredOutItems = filterData?.filteredOut || [];
    const totalItems = filterData?.totalItems || 0;

    return (
        <div className="filter-modal-overlay">
            <div className="filter-modal-content">
                <div className="filter-modal-header">
                    <h2>Items Hidden Due to Your Preferences</h2>
                    <button className="filter-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="filter-modal-body">
                    {filteredOutItems.length === 0 ? (
                        <p>No items were filtered out by your preferences!</p>
                    ) : (
                        <>
                            <p className="filter-summary">
                                {filteredOutItems.length} item{filteredOutItems.length !== 1 ? 's' : ''} hidden from a total of {totalItems}
                            </p>

                            <div className="filtered-items-list">
                                {filteredOutItems.map((item) => (
                                    <div key={item.id} className="filtered-item">
                                        <h3>{item.name}</h3>
                                        {item.reasons && item.reasons.length > 0 && (
                                            <div className="filter-reasons">
                                                <p><strong>Reasons:</strong></p>
                                                <ul>
                                                    {item.reasons.map((reason, index) => (
                                                        <li key={index}>{reason}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="filter-modal-footer">
                    <button className="filter-btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default FilterDetailsModal; 