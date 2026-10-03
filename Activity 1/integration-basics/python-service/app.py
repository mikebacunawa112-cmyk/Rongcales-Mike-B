from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json() or {}
    num1 = float(data.get('num1', 0))
    num2 = float(data.get('num2', 0))
    operation = data.get('operation', 'add')

    if operation == 'add':
        result = num1 + num2
    elif operation == 'subtract':
        result = num1 - num2
    elif operation == 'multiply':
        result = num1 * num2
    elif operation == 'divide':
        if num2 == 0:
            return jsonify({'status': 'error', 'message': 'Division by zero'}), 400
        result = num1 / num2
    else:
        return jsonify({'status': 'error', 'message': 'Invalid operation'}), 400

    return jsonify({
        'status': 'success',
        'input': data,
        'result': result,
        'message': 'Python processed your request!'
    })

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'Python is running!'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)