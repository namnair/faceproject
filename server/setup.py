import subprocess
import sys
import os

# Check if python3 is installed


def check_python3():
    try:
        subprocess.check_call([sys.executable, '--version'])
    except subprocess.CalledProcessError:
        print("Python3 is not installed. Please install it first.")
        sys.exit(1)

# Create and activate virtual environment, then install requirements


def setup_venv():
    # Check if Python3 is being used
    check_python3()

    # Name of the virtual environment
    venv_dir = "venv"

    # Check if the virtual environment already exists
    if not os.path.exists(venv_dir):
        print(f"Creating virtual environment in {venv_dir}...")
        subprocess.check_call([sys.executable, "-m", "venv", venv_dir])

    # Ensure pip is up-to-date in the virtual environment
    print(f"Upgrading pip in the virtual environment...")
    subprocess.check_call(
        [f"{venv_dir}/bin/python", "-m", "pip", "install", "--upgrade", "pip"])

    # Install dependencies from requirements.txt if it exists
    if os.path.exists("requirements.txt"):
        print("Installing dependencies from requirements.txt...")
        subprocess.check_call(
            [f"{venv_dir}/bin/python", "-m", "pip", "install", "-r", "requirements.txt"])
    else:
        print("No requirements.txt found.")

    print("")
    print("")
    print("")
    print("")
    # Print out the command for the user to activate the virtual environment
    if sys.platform == "win32":
        print("\nTo activate the virtual environment, run the following command in your command prompt:")
        print(f"venv\\Scripts\\activate.bat")
    else:
        print("\nTo activate the virtual environment, run the following command in your terminal:")
        print(f"source venv/bin/activate")

    print("")
    print("")
    print("")
    print("")


if __name__ == "__main__":
    setup_venv()
