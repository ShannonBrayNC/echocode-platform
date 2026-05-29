"""Generated EchoCode CI smoke package.

This package keeps the legacy Python EchoCode CI contract alive while the
EchoCodex TypeScript runtime evolves alongside it.
"""

from .lantern_ci_smoke import validate_lantern_ci_contract

__all__ = ["validate_lantern_ci_contract"]
