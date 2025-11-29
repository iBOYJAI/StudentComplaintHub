from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Category, Location, RoutingRule, SLARule
from ..schemas import (
    CategoryCreate, CategoryResponse, LocationCreate, LocationResponse,
    RoutingRuleCreate, RoutingRuleResponse, SLARuleCreate, SLARuleResponse
)
from ..utils.auth import get_current_user, is_admin
from ..utils.audit import log_action

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Categories
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    """List all categories"""
    categories = db.query(Category).filter(Category.is_active == True).all()
    return [CategoryResponse.from_orm(cat) for cat in categories]

@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create category (admin only)"""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = Category(
        name=category_data.name,
        description=category_data.description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    
    log_action(db, current_user.id, "CATEGORY_CREATED", "Category", category.id)
    return CategoryResponse.from_orm(category)

# Locations
@router.get("/locations", response_model=List[LocationResponse])
async def list_locations(db: Session = Depends(get_db)):
    """List all locations"""
    locations = db.query(Location).filter(Location.is_active == True).all()
    return [LocationResponse.from_orm(loc) for loc in locations]

@router.post("/locations", response_model=LocationResponse)
async def create_location(
    location_data: LocationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create location (admin only)"""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    location = Location(
        name=location_data.name,
        description=location_data.description
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    
    log_action(db, current_user.id, "LOCATION_CREATED", "Location", location.id)
    return LocationResponse.from_orm(location)

# Routing Rules
@router.get("/routing-rules", response_model=List[RoutingRuleResponse])
async def list_routing_rules(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List routing rules (staff only)"""
    rules = db.query(RoutingRule).filter(RoutingRule.is_active == True).all()
    return [RoutingRuleResponse.from_orm(rule) for rule in rules]

@router.post("/routing-rules", response_model=RoutingRuleResponse)
async def create_routing_rule(
    rule_data: RoutingRuleCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create routing rule (admin only)"""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    rule = RoutingRule(**rule_data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    log_action(db, current_user.id, "ROUTING_RULE_CREATED", "RoutingRule", rule.id)
    return RoutingRuleResponse.from_orm(rule)

# SLA Rules
@router.get("/sla-rules", response_model=List[SLARuleResponse])
async def list_sla_rules(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List SLA rules"""
    rules = db.query(SLARule).filter(SLARule.is_active == True).all()
    return [SLARuleResponse.from_orm(rule) for rule in rules]

@router.post("/sla-rules", response_model=SLARuleResponse)
async def create_sla_rule(
    rule_data: SLARuleCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create SLA rule (admin only)"""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    rule = SLARule(**rule_data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    log_action(db, current_user.id, "SLA_RULE_CREATED", "SLARule", rule.id)
    return SLARuleResponse.from_orm(rule)
