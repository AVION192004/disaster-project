import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReportDisaster = () => {
    const [error, setError] = useState(null);
    const [disasterData, setDisasterData] = useState(null);

    useEffect(() => {
        const fetchDisasterData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/disasters');
                setDisasterData(response.data);
            } catch (err) {
                console.error('Error fetching disaster data:', err);
                setError('Failed to fetch disaster data. Please try again later.');
            }
        };

        fetchDisasterData();
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Report Disaster</h1>
            {/* Render disaster data here */}
        </div>
    );
};

export default ReportDisaster;