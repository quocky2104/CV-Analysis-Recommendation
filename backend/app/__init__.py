"""CVision AI Backend Application package."""

import sys
import types

# Ensure python_multipart is recognized by FastAPI if not yet installed in local environment
if "python_multipart" not in sys.modules:
    try:
        import python_multipart  # noqa: F401
    except ImportError:
        try:
            import multipart  # noqa: F401
        except ImportError:
            pm = types.ModuleType("python_multipart")
            pm.__version__ = "0.0.20"
            sys.modules["python_multipart"] = pm

__version__ = "1.0.0"
