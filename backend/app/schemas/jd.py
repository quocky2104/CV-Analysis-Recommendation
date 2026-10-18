from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import Priority


class JDRequirement(BaseModel):
    id: str = Field(description="Stable identifier for the requirement, e.g. REQ-001")
    description: str = Field(description="Text description of the requirement")
    priority: Priority = Field(default=Priority.REQUIRED, description="Importance level")
    category: str = Field(default="Technical", description="Category such as Technical, Experience, Education, Soft Skills")
    source_context: Optional[str] = Field(default=None, description="Original excerpt or section from the JD")


class JDAnalysis(BaseModel):
    job_title: Optional[str] = None
    seniority: Optional[str] = None
    industry: Optional[str] = None
    requirements: List[JDRequirement] = Field(default_factory=list)
