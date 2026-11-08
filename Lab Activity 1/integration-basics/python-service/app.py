
from flask import Flask, request, jsonify
import math

app = Flask(__name__)

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json() or {}

        num1 = float(data.get('num1', 0))
        num2 = float(data.get('num2', 0))
        operation = data.get('operation', 'add')

        if not math.isfinite(num1) or not math.isfinite(num2):
            return jsonify({
                'status': 'error',
                'message': 'Numbers must be finite values.'
            }), 400

        if operation == 'add':
            result = num1 + num2

        elif operation == 'subtract':
            result = num1 - num2

        elif operation == 'multiply':
            result = num1 * num2

        elif operation == 'divide':
            if num2 == 0:
                return jsonify({
                    'status': 'error',
                    'message': 'Division by zero error.'
                }), 400
            result = num1 / num2

        elif operation == 'modulo':
            if num2 == 0:
                return jsonify({
                    'status': 'error',
                    'message': 'Modulo by zero error.'
                }), 400
            result = num1 % num2

        elif operation == 'power':
            result = num1 ** num2

        elif operation == 'square-root':
            if num1 < 0:
                return jsonify({
                    'status': 'error',
                    'message': 'Cannot calculate square root of a negative number.'
                }), 400
            result = math.sqrt(num1)

        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid operation.'
            }), 400

        if isinstance(result, complex) or not math.isfinite(result):
            return jsonify({
                'status': 'error',
                'message': 'Calculation result is outside the supported numeric range.'
            }), 400

        return jsonify({
            'status': 'success',
            'input': data,
            'result': result,
            'message': 'Python processed your request successfully!'
        })

    except (ValueError, TypeError, OverflowError) as error:
        return jsonify({
            'status': 'error',
            'message': str(error)
        }), 400

    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred.'
        }), 500


@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({
        'status': 'Python is running!'
    })


if __name__ == '__main__':
    app.run(
        host='127.0.0.1',
        port=5001,
        debug=True
    )
