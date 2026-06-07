import { useState, useEffect } from "react";
import Editor from "react-simple-wysiwyg";
import { message } from "antd";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TermsConditionAdmin = () => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const res = await fetch(`${API}/api/settings/terms_condition`);
                if (res.ok) {
                    const data = await res.json();
                    setContent(data.value || "");
                }
            } catch (err: any) {
                // message.error("Failed to fetch terms and conditions.");
            }
        };
        fetchPolicy();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "terms_condition", value: content })
            });
            if (res.ok) {
                message.success("Terms & Conditions saved successfully!");
                setIsEditing(false);
            } else {
                throw new Error("Failed to save");
            }
        } catch (err) {
            message.error("Failed to save terms and conditions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="row">
                        <div className="col-sm-12">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="#">Super Admin</a></li>
                                <li className="breadcrumb-item"><i className="feather-chevron-right" /></li>
                                <li className="breadcrumb-item active">Terms & Conditions</li>
                            </ul>
                            <div className="page-title mt-2">
                                <h3>Manage Terms & Conditions</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h4 className="card-title mb-0">Terms & Conditions Content</h4>
                                {isEditing ? (
                                    <div>
                                        <button
                                            className="btn btn-secondary me-2"
                                            onClick={() => setIsEditing(false)}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSave}
                                            disabled={loading}
                                        >
                                            {loading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit Content
                                    </button>
                                )}
                            </div>
                            <div className="card-body">
                                <div className="form-group mb-0">
                                    {isEditing ? (
                                        <>
                                            <label>Editor</label>
                                            <Editor
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                containerProps={{ style: { minHeight: "400px" } }}
                                            />
                                        </>
                                    ) : (
                                        <div
                                            style={{ minHeight: "400px", padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc' }}
                                            dangerouslySetInnerHTML={{ __html: content || "<p>No terms and conditions content available. Click Edit to add some.</p>" }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditionAdmin;
