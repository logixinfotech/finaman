import React, { useEffect, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import { FaChartLine, FaCog, FaShoppingCart, FaUsers, FaHome, FaChartBar } from "react-icons/fa";  // Icons for departments
import "./FinamanDashboard.css";

// Importing Chart.js components
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend
);

function FinamanDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});

    // Sample Data for ERP departments
    useEffect(() => {
        setTimeout(() => {
            setData({
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                sales: [120, 190, 300, 280, 250, 400],
                productionOutput: [4000, 4200, 4300, 4500, 4600, 4700],
                productSales: [180, 260, 140, 220],
                qcResults: [90, 10],
                defectCategories: [5, 8, 3],
                employeesByDept: [30, 25, 10, 15],
                salaryDistribution: [70, 20, 10],
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="finaman-loading">Loading Dashboard...</div>;

    // Chart Data Configurations
    const lineData = {
        labels: data.months,
        datasets: [
            {
                label: "Monthly Sales",
                data: data.sales,
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76,175,80,0.2)",
                tension: 0.4,
                borderWidth: 2,
                fill: true,
            },
        ],
    };

    const barData = {
        labels: ["Tablet", "Capsule", "Injection", "Syrup"],
        datasets: [
            {
                label: "Product Performance",
                data: data.productSales,
                backgroundColor: ["#22c55e", "#3b82f6", "#f97316", "#9333ea"],
            },
        ],
    };

    const pieData = {
        labels: ["Production", "QC", "Warehouse"],
        datasets: [
            {
                data: [45, 30, 25],
                backgroundColor: ["#10b981", "#0ea5e9", "#f59e0b"],
            },
        ],
    };

    return (
        <div className="finaman-dashboard">
            <div className="cards">
                {/* Sales Overview */}
                <div className="card card-hover">
                    <div className="card-header">
                        <FaChartLine size={24} />
                        <h3>Sales Overview</h3>
                    </div>
                    <Line data={lineData} options={{ responsive: true, animation: { duration: 1500 } }} />
                </div>

                {/* Product Performance */}
                <div className="card card-hover">
                    <div className="card-header">
                        <FaCog size={24} />
                        <h3>Product Performance</h3>
                    </div>
                    <Bar data={barData} options={{ responsive: true, animation: { duration: 1500 } }} />
                </div>

                {/* Department Distribution */}
                <div className="card card-hover">
                    <div className="card-header">
                        <FaShoppingCart size={24} />
                        <h3>Department Distribution</h3>
                    </div>
                    <Pie data={pieData} options={{ responsive: true, animation: { duration: 1500 } }} />
                </div>

                {/* Employee Overview */}
                <div className="card card-hover">
                    <div className="card-header">
                        <FaUsers size={24} />
                        <h3>Employee Overview</h3>
                    </div>
                    {/* Additional HR charts like Headcount or Salary can be added here */}
                </div>

                {/* Production Overview */}
                <div className="card card-hover">
                    <div className="card-header">
                        <FaHome size={24} />
                        <h3>Production Overview</h3>
                    </div>
                    {/* Additional charts related to Production Efficiency */}
                </div>

                {/* Finance Section (Accounts Receivable / Payable) */}
                <div className="card card-hover">
                    <div className="card-header">
                        <FaChartBar size={24} />
                        <h3>Finance Overview</h3>
                    </div>
                    {/* Charts for financial performance, accounts payable/receivable */}
                </div>
            </div>
        </div>
    );
}

export default FinamanDashboard;
