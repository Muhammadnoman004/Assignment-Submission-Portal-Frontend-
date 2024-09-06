import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import LoaderContext from '../../Context/LoaderContext';
import api from '../../api/api';
import { LiaClipboardListSolid } from 'react-icons/lia';
import { Button, Card, Tag, Spin, Alert, Progress, Modal, Upload, Dropdown, Space, Input } from 'antd';
import { FaArrowLeft, FaPlus, FaDownload } from 'react-icons/fa';
import useFetchProfile from '../../utils/useFetchProfile';
import uploadFileToFirebase from '../../utils/uploadFileToFirebase';
import { MdAttachFile } from 'react-icons/md';
import { IoLink } from 'react-icons/io5';
import AssignmentSubmitFormModal from '../../Components/AssignmentSubmitFormModal/AssignmentSubmitFormModal';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const { Meta } = Card;

function AssignmentDetailPage() {
    const { user } = useFetchProfile();
    const { classId, assignmentId } = useParams();
    const { loader, setLoader } = useContext(LoaderContext);
    const [loading, setLoading] = useState(true);
    const [submitModalVisible, setSubmitModalVisible] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [dropDownItem, setDropDownItem] = useState(null);
    const [submissionText, setSubmissionText] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAssignmentReport();
    }, [assignmentId]);

    const fetchAssignmentReport = async () => {
        setLoader(true);
        setLoading(true);
        setError(null);
        try {
            const userId = localStorage.getItem('userId');
            const response = await api.get(`/api/assignments/${assignmentId}/report/${userId}`);
            setLoading(false);
            setLoader(false);
            setReport(response.data);
        } catch (err) {
            setLoading(false);
            setLoader(false);
            if (err.response && err.response.status === 404) {
                setReport(null);
                return;
            }
            setError('Failed to load assignment details. Please try again later.');
        }
    };

    const showSubmitModal = () => setSubmitModalVisible(true);

    const handleUnSubmit = async () => {
        // setLoader(true);
        // try {
        //     await api.post(`/api/assignments/${assignmentId}/unsubmit`);
        //     fetchAssignmentReport(); // Refresh the report after unsubmitting
        // } catch (err) {
        //     console.error('Error unsubmitting assignment:', err);
        //     setError('Failed to unsubmit assignment. Please try again.');
        // } finally {
        //     setLoader(false);
        // }
    };

    const renderFilePreview = (fileLink) => {
        if (!fileLink) return null;
        if (fileLink.match(/\.(jpeg|jpg|gif|png)$/i)) {
            return <img src={fileLink} alt="Assignment file" className="w-full h-64 object-contain" />;
        } else if (fileLink.match(/\.pdf$/i)) {
            return <iframe src={fileLink} className="w-full h-64 border rounded-md" title="PDF Preview" />;
        } else {
            return (
                <>
                    <img src={fileLink} alt="Assignment file" className="w-full h-64 object-contain" />
                    <a className="bg-gray-100 p-4 rounded-md shadow text-center py-3 px-2 font-bold break-all text-gray-500" href={fileLink}>
                        fileLink
                    </a>
                </>
            );
        }
    };

    if (error) {
        return (
            <div className="p-4">
                <Alert message="Error" description={error} type="error" showIcon />
            </div>
        );
    }

    return (
        <div className='p-4 ps-5'>
            {
                loading ? (
                    <div className="flex justify-center items-center h-screen">
                        <Spin size="large" />
                    </div>
                ) : error || !report ?
                    error ? (
                        <div className="p-4">
                            <Alert message="Error" description={error} type="error" showIcon />
                        </div>
                    ) :
                        (
                            <div className="p-4">
                                <Alert message="Assignment not found" description="The requested assignment could not be found." type="warning" showIcon />
                            </div>
                        ) : (
                        <div>
                            <header className="bg-teal-600 text-white p-4 rounded-lg mb-4">
                                <h1 className="text-2xl flex items-center gap-3">
                                    <button className='border-2 p-2 text-xl rounded-full hover:border-blue-700 transition duration-200' onClick={() => navigate(-1)}>
                                        <FaArrowLeft />
                                    </button>
                                    {report.assignmentTitle}
                                </h1>
                                <p className="text-md ml-12">{report.description}</p>
                            </header>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-2'>
                                <section className='col-span-2'>
                                    <div className="bg-gray-100 rounded-lg p-4">
                                        <div className='mb-4'>
                                            <h2 className="text-3xl flex gap-3 items-center">
                                                <LiaClipboardListSolid /> {report.assignmentTitle}
                                            </h2>
                                            <h3 className='ms-10 mt-2 text-gray-700'>
                                                Due: {new Date(report.dueDate).toLocaleDateString()}
                                            </h3>
                                        </div>
                                        <div className='bg-white p-4 rounded-lg shadow mb-4 mt-3'>
                                            <p>{report.description}</p>
                                            <div className='border-t-2 mt-4 pt-4'>
                                                <h2 className='text-xl font-bold mb-3'>Assignment File:</h2>
                                                {report.assignmentFile ? (
                                                    <Button
                                                        type="primary"
                                                        icon={<FaDownload />}
                                                        href={report.assignmentFile}
                                                        target="_blank"
                                                    >
                                                        Download Assignment
                                                    </Button>
                                                ) : (
                                                    <p>No file attached to this assignment.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white p-4 rounded-lg shadow h-max">
                                    <h2 className="text-xl mb-4">Your Submission</h2>
                                    {report.submissionDate ? (
                                        <>
                                            <div className="mb-4">
                                                <p>Submitted on: {new Date(report.submissionDate).toLocaleString()}</p>
                                                <p>Status: <Tag color={report.marks !== undefined ? "green" : "orange"}>
                                                    {report.marks !== undefined ? "Evaluated" : "Submitted"}
                                                </Tag></p>
                                                <p>Total Marks: {report.totalMarks}</p>
                                                {report.marks !== undefined && (
                                                    <>
                                                        <p>Obtained Marks: {report.marks}</p>
                                                        <Progress
                                                            percent={Math.round((report.marks / report.totalMarks) * 100)}
                                                            status="active"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                            {renderFilePreview(report.submittedFileLink)}
                                            {report.rating && (
                                                <div className="mt-4">
                                                    <h3 className="font-bold mb-2">Rating:</h3>
                                                    <p>{report.rating}</p>
                                                </div>
                                            )}
                                            {report.remark && (
                                                <div className="mt-4">
                                                    <h3 className="font-bold mb-2">Remark:</h3>
                                                    <p>{report.remark}</p>
                                                </div>
                                            )}
                                            <div className='mt-3'>
                                                <Button className='w-full text-blue-600' onClick={handleUnSubmit}>Unsubmit</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <Link
                                                to={`/trainer/class/${classId}/${assignmentId}/submissions`}
                                                className="myBtn"
                                            >
                                                View Submissions
                                            </Link>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    )
            }
        </div >
    );
}

export default AssignmentDetailPage;