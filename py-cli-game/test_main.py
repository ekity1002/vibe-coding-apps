import unittest
from unittest.mock import patch
import re  # 色コード除去のために追加
from main import Character, get_health_bar

class TestCharacter(unittest.TestCase):
    """Characterクラスのテスト"""

    def setUp(self):
        """テスト用のキャラクターをセットアップ"""
        self.player = Character("テストプレイヤー", 100, 15)
        self.enemy = Character("テストエネミー", 80, 10)

    def test_attack(self):
        """攻撃メソッドのテスト"""
        initial_hp = self.enemy.hp
        damage = self.player.attack(self.enemy)
        self.assertEqual(self.enemy.hp, initial_hp - damage)
        self.assertEqual(damage, self.player.ap)

    def test_heal(self):
        """回復メソッドのテスト"""
        self.player.hp = 50
        with patch('random.randint', return_value=15):
            heal_amount = self.player.heal()
        self.assertEqual(self.player.hp, 65)
        self.assertEqual(heal_amount, 15)

    def test_heal_over_max_hp(self):
        """最大HPを超えて回復しないかのテスト"""
        self.player.hp = 95
        with patch('random.randint', return_value=15):
            self.player.heal()
        self.assertEqual(self.player.hp, self.player.max_hp)

    def test_is_alive(self):
        """生存確認メソッドのテスト"""
        self.assertTrue(self.player.is_alive())
        self.player.hp = 0
        self.assertFalse(self.player.is_alive())

class TestHealthBar(unittest.TestCase):
    """HPバー生成関数のテスト"""

    def strip_ansi(self, text):
        """ANSIエスケープシーケンス（色コード）を除去する"""
        return re.sub(r'\x1b\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]', '', text)

    def test_get_health_bar_full(self):
        """HPが満タンの時のバー表示"""
        bar = get_health_bar(100, 100, length=10)
        clean_bar = self.strip_ansi(bar)
        # 色コードを除いた基本的な構造をテスト
        self.assertIn('█' * 10, clean_bar)
        self.assertIn("100/100", clean_bar)

    def test_get_health_bar_half(self):
        """HPが半分の時のバー表示"""
        bar = get_health_bar(50, 100, length=10)
        clean_bar = self.strip_ansi(bar)
        self.assertIn('█' * 5 + '─' * 5, clean_bar)
        self.assertIn("50/100", clean_bar)

    def test_get_health_bar_empty(self):
        """HPが0の時のバー表示"""
        bar = get_health_bar(0, 100, length=10)
        clean_bar = self.strip_ansi(bar)
        self.assertIn('─' * 10, clean_bar)
        self.assertIn("0/100", clean_bar)

if __name__ == '__main__':
    unittest.main()