#!/usr/bin/env python3
"""
Script para carregar templates iniciais e configurações de component_template_config.
Este script deve ser executado após as migrations para popular o banco com dados iniciais.
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path para importar os módulos
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from uuid import uuid4

import app.models.template as TemplateModel
import app.models.component_template_config as ComponentTemplateConfigModel


def read_template_file(file_path: Path) -> str:
    """Lê o conteúdo de um arquivo de template."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def get_variables_schema() -> str:
    """Retorna o schema JSON das variáveis disponíveis para os templates."""
    return """{
  "application": {
    "component_name": "string",
    "application_name": "string",
    "environment": "string",
    "image": "string",
    "version": "string",
    "workload": "string",
    "settings": {
      "cpu": "number",
      "memory": "number",
      "cpu_scaling_threshold": "number",
      "memory_scaling_threshold": "number",
      "custom_metrics": {
        "enabled": "boolean",
        "port": "number",
        "path": "string"
      },
      "endpoints": [
        {
          "source_port": "number",
          "dest_port": "number"
        }
      ],
      "envs": [
        {
          "key": "string",
          "value": "string"
        }
      ],
      "secrets": [
        {
          "key": "string",
          "value": "string"
        }
      ],
      "healthcheck": {
        "protocol": "string",
        "path": "string",
        "port": "number",
        "failure_threshold": "number",
        "initial_interval": "number",
        "interval": "number",
        "timeout": "number"
      }
    }
  },
  "environment": {
    "disable_workload": "boolean"
  }
}"""


def load_templates(db: Session):
    """Carrega os templates iniciais na tabela templates."""
    templates_dir = Path(__file__).parent.parent / "app" / "k8s" / "templates" / "webapp"

    templates_data = [
        {
            "name": "Webapp Deployment",
            "description": "Template de Deployment para componentes webapp",
            "category": "webapp",
            "file_path": templates_dir / "deployment.yaml.j2",
            "render_order": 1,
        },
        {
            "name": "Webapp Service",
            "description": "Template de Service para componentes webapp",
            "category": "webapp",
            "file_path": templates_dir / "service.yaml.j2",
            "render_order": 2,
        },
        {
            "name": "Webapp HPA",
            "description": "Template de HorizontalPodAutoscaler para componentes webapp",
            "category": "webapp",
            "file_path": templates_dir / "hpa.yaml.j2",
            "render_order": 3,
        },
    ]

    created_templates = []

    for template_data in templates_data:
        # Verificar se o template já existe (por nome e categoria)
        existing_template = (
            db.query(TemplateModel.Template)
            .filter(
                TemplateModel.Template.name == template_data["name"],
                TemplateModel.Template.category == template_data["category"]
            )
            .first()
        )

        if existing_template:
            print(f"Template '{template_data['name']}' já existe, verificando configuração...")
            # Verificar se já existe component_template_config para este template
            # A constraint única é por component_type e template_id
            existing_config = (
                db.query(ComponentTemplateConfigModel.ComponentTemplateConfig)
                .filter(
                    ComponentTemplateConfigModel.ComponentTemplateConfig.template_id == existing_template.id,
                    ComponentTemplateConfigModel.ComponentTemplateConfig.component_type == "webapp"
                )
                .first()
            )

            if not existing_config:
                # Criar a configuração se não existir
                try:
                    config = ComponentTemplateConfigModel.ComponentTemplateConfig(
                        uuid=uuid4(),
                        component_type="webapp",
                        template_id=existing_template.id,
                        render_order=template_data["render_order"],
                        enabled="true",
                    )
                    db.add(config)
                    db.flush()
                    print(f"  ✓ Configuração criada para template '{template_data['name']}'")
                except Exception as e:
                    print(f"  ⚠ Erro ao criar configuração: {e}")
            else:
                # Atualizar render_order se necessário
                if existing_config.render_order != template_data["render_order"]:
                    existing_config.render_order = template_data["render_order"]
                    print(f"  ✓ Render order atualizado para template '{template_data['name']}'")
                else:
                    print(f"  ✓ Configuração já existe para template '{template_data['name']}'")

            created_templates.append(existing_template)
            continue

        # Ler o conteúdo do arquivo
        if not template_data["file_path"].exists():
            print(f"AVISO: Arquivo não encontrado: {template_data['file_path']}")
            continue

        content = read_template_file(template_data["file_path"])

        # Criar o template
        new_template = TemplateModel.Template(
            uuid=uuid4(),
            name=template_data["name"],
            description=template_data["description"],
            category=template_data["category"],
            content=content,
            variables_schema=get_variables_schema(),
        )

        db.add(new_template)
        db.flush()  # Flush para obter o ID

        # Criar a configuração de component_template_config
        config = ComponentTemplateConfigModel.ComponentTemplateConfig(
            uuid=uuid4(),
            component_type="webapp",
            template_id=new_template.id,
            render_order=template_data["render_order"],
            enabled="true",
        )

        db.add(config)
        created_templates.append(new_template)
        print(f"✓ Template '{template_data['name']}' criado com sucesso")

    db.commit()
    return created_templates


def main():
    """Função principal."""
    print("🚀 Carregando templates iniciais...")

    db: Session = SessionLocal()
    try:
        templates = load_templates(db)
        print(f"\n✅ {len(templates)} template(s) processado(s) com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao carregar templates: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

