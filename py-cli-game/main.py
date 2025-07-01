import random
import os
import sys
from colorama import init, Fore, Style
import readchar

# coloramaの初期化
init(autoreset=True)

class Character:
    """プレイヤーと敵のキャラクターを管理するクラス"""
    def __init__(self, name, hp, ap):
        self.name = name
        self.max_hp = hp
        self.hp = hp
        self.ap = ap

    def attack(self, target):
        """ターゲットを攻撃する"""
        damage = self.ap
        target.hp = max(0, target.hp - damage)
        return damage

    def heal(self):
        """自身のHPを回復する"""
        heal_amount = random.randint(10, 20)
        self.hp = min(self.max_hp, self.hp + heal_amount)
        return heal_amount

    def is_alive(self):
        """生存しているか確認する"""
        return self.hp > 0

def get_health_bar(hp, max_hp, length=20):
    """色付きのHPバーを生成する"""
    percent = hp / max_hp
    filled_length = int(length * percent)
    bar_color = Fore.GREEN
    if percent < 0.5:
        bar_color = Fore.YELLOW
    if percent < 0.25:
        bar_color = Fore.RED
    
    bar = bar_color + '█' * filled_length + Style.RESET_ALL + '─' * (length - filled_length)
    return f"[{bar}] {hp}/{max_hp}"

def display_status(player, enemy):
    """現在のステータスを表示する"""
    os.system('cls' if os.name == 'nt' else 'clear')
    print("--- バトル状況 ---")
    print(f"{player.name}:")
    print(f"  HP: {get_health_bar(player.hp, player.max_hp)}")
    print("-" * 20)
    print(f"{enemy.name}:")
    print(f"  HP: {get_health_bar(enemy.hp, enemy.max_hp)}")
    print("--------------------\n")

def get_player_action(options):
    """キー入力で行動を選択させる"""
    selected_index = 0
    
    def print_options():
        for i, option in enumerate(options):
            if i == selected_index:
                print(f"> {Fore.CYAN}{option}{Style.RESET_ALL}")
            else:
                print(f"  {option}")

    while True:
        display_status(player, enemy)
        print("どうする？")
        print_options()
        
        pressed_key = readchar.readkey()

        if pressed_key in (readchar.key.UP, 'w', 'W', '\x1b[A'):
            selected_index = (selected_index - 1) % len(options)
        elif pressed_key in (readchar.key.DOWN, 's', 'S', '\x1b[B'):
            selected_index = (selected_index + 1) % len(options)
        elif pressed_key in (readchar.key.ENTER, '\r'):
            return options[selected_index].lower()

def main():
    """ゲームのメインループ"""
    global player, enemy
    player = Character("あなた", 100, 15)
    enemy = Character("スライム", 80, 10)

    turn = 1
    while player.is_alive() and enemy.is_alive():
        display_status(player, enemy)
        print(f"--- ターン {turn} ---")
        
        action = get_player_action(["Attack", "Heal"])

        if action == "attack":
            damage = player.attack(enemy)
            print(f"\n{player.name} の攻撃！ {enemy.name} に {damage} のダメージを与えた。")
        elif action == "heal":
            heal_amount = player.heal()
            print(f"\n{player.name} はHPを {heal_amount} 回復した。")

        input("\n続けるにはEnterキーを押してください...")

        if not enemy.is_alive():
            break

        display_status(player, enemy)
        print(f"--- ターン {turn} ---")
        damage = enemy.attack(player)
        print(f"\n{enemy.name} の攻撃！ {player.name} は {damage} のダメージを受けた。")
        
        input("\n続けるにはEnterキーを押してください...")
        turn += 1

    display_status(player, enemy)
    if player.is_alive():
        print(f"\n{enemy.name} を倒した！あなたの勝利です！")
    else:
        print(f"\n{player.name} は倒れてしまった...あなたの敗北です。")
    sys.exit(0)


if __name__ == "__main__":
    main()
