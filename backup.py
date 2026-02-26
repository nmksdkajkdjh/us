#!/usr/bin/env python3
"""
SwiftLoan USA - Database Backup & Restore Utility
用于备份和恢复 MongoDB 数据
"""

import json
import os
from datetime import datetime
import subprocess
import sys

class SwiftLoanBackup:
    def __init__(self):
        self.db_name = 'swiftloan_db'
        self.collection = 'applications'
        self.backup_dir = 'backups'
        
    def create_backup_dir(self):
        """创建备份目录"""
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
            print(f"✓ 已创建备份目录: {self.backup_dir}")
    
    def backup_database(self, mongodb_uri='mongodb://localhost:27017'):
        """备份数据库"""
        self.create_backup_dir()
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(self.backup_dir, f'{timestamp}_applications.json')
        
        try:
            cmd = [
                'mongoexport',
                '--uri', mongodb_uri,
                '--db', self.db_name,
                '--collection', self.collection,
                '--out', backup_file,
                '--jsonFormat', 'canonical'
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"✅ 备份成功: {backup_file}")
            return backup_file
            
        except subprocess.CalledProcessError as e:
            print(f"❌ 备份失败: {e.stderr.decode()}")
            return None
    
    def restore_database(self, backup_file, mongodb_uri='mongodb://localhost:27017'):
        """恢复数据库"""
        try:
            cmd = [
                'mongoimport',
                '--uri', mongodb_uri,
                '--db', self.db_name,
                '--collection', self.collection,
                '--file', backup_file,
                '--jsonFormat', 'canonical'
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"✅ 恢复成功: {backup_file}")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ 恢复失败: {e.stderr.decode()}")
    
    def list_backups(self):
        """列出所有备份"""
        if not os.path.exists(self.backup_dir):
            print("❌ 备份目录不存在")
            return
        
        backups = sorted(os.listdir(self.backup_dir), reverse=True)
        if not backups:
            print("⚠️ 没有备份文件")
            return
        
        print(f"\n📦 可用备份 ({len(backups)} 个):")
        for i, backup in enumerate(backups, 1):
            filepath = os.path.join(self.backup_dir, backup)
            size = os.path.getsize(filepath) / 1024  # KB
            print(f"  {i}. {backup} ({size:.2f} KB)")
    
    def delete_old_backups(self, keep_count=10):
        """删除老备份，仅保留最新的N个"""
        if not os.path.exists(self.backup_dir):
            return
        
        backups = sorted(os.listdir(self.backup_dir), reverse=True)
        if len(backups) > keep_count:
            to_delete = backups[keep_count:]
            for backup in to_delete:
                filepath = os.path.join(self.backup_dir, backup)
                os.remove(filepath)
                print(f"🗑️ 已删除: {backup}")

if __name__ == '__main__':
    backup = SwiftLoanBackup()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'backup':
            backup.backup_database()
        elif command == 'list':
            backup.list_backups()
        elif command == 'restore':
            if len(sys.argv) > 2:
                backup.restore_database(sys.argv[2])
            else:
                print("用法: python backup.py restore <backup_file>")
        elif command == 'cleanup':
            backup.delete_old_backups()
        else:
            print("未知命令")
    else:
        print("""
        SwiftLoan Backup Tool
        
        用法:
          python backup.py backup    - 备份数据库
          python backup.py list      - 列出所有备份
          python backup.py restore <file>  - 恢复备份
          python backup.py cleanup   - 清理旧备份
        """)
